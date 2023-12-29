FROM node:18.16.0
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3002
ENV TZ=Asia/Bangkok
CMD ["node", "app.js"]