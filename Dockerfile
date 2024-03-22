# Gunakan Node.js sebagai base image
FROM node:14

# Set working directory
WORKDIR /usr/src/app

# Salin dependensi dan file proyek
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin kode sumber
COPY . .

# Expose port 3000
EXPOSE 4000

# Jalankan aplikasi
CMD ["npm", "start"]
