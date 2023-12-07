const db = require("../helper/database");

const getCandidateResult = async (roomId) => {
  const candidateResult = await db.query(
    `select 
      b.id, 
      b.name, 
      fn_convert_integer(b.position__id) as "positionId", 
      c.name as position, 
      b.candidate_photo as "candidatePhoto", 
      fn_convert_integer(coalesce(count(a.id), 0)) as vote
      from vote_master_room_candidate b
      left join vote_master_room_participants_voting a on a.candidate__id = b.id
      left join vote_master_position c on b.position__id = c.id
      where b.room__id = $1
      group by b.id, b.name, b.position__id, c.name, b.candidate_photo;`,
    [roomId]
  );

  return candidateResult.rows
};


module.exports = {
    getCandidateResult
}