FROM node:22

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]