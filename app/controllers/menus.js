const db = require('../helper/database')

async function getMenus(userId, languageId) {
    const getUserGroup = await db.query(`SELECT a.id
                                            from vote_master_organization_user_group a
                                            left join vote_master_organization_user_group_member b on a.id = b.user_group__id
                                            where b.user__id = $1`, [userId])

    const userGroupId = getUserGroup.rows

    if (userGroupId.length > 0) {
        const userGroup = userGroupId.map((entry) => entry.id).join(', ')
        const query = await db.query(`SELECT distinct on(a.orders, a.id, c.id)
                        a.id,
                        a.parent_id,
                        a.orders,
                        a.routes,
                        a.target,
                        a.icon,
                        b.name,
                        c.type
                        from vote_system_menus a
                        left join vote_system_menus_language b on a.id = b.menus__id and a.modules__id = b.modules__id
                        left join vote_system_menus_detail c on a.id = c.menus__id
                        join vote_master_organization_user_group_access d on c.menus__id = d.menus__id and c.type = d.type
                        where d.user_group__id in($1)
                        and language__id = $2
                        order by a.orders, a.id, c.id`, [userGroup, languageId])

        const results = query.rows
        const menu = []
        let lastMenu = null, counter = 0

        results.map((item, i) => {
            if (lastMenu !== item.id) {
                menu.push({
                    ...item,
                    id: parseInt(item.id),
                    parentId: parseInt(item.parent_id),
                    order: parseInt(item.orders),
                    access: null
                })

                lastMenu = item.id
                counter++
            }

            if (menu[counter - 1].access === null) {
                menu[counter - 1].access = [];  // Atur menu.access menjadi array kosong jika sebelumnya null
            }

            menu[counter - 1].access.push(item.type)
        })

        return {
            status: 'success',
            message: 'Successfully get menu!',
            data: menu
        }
    } else {
        return {
            status: 'error',
            message: `This user doesn't have a user group`,
            data: null
        }
    }

}

module.exports = getMenus