FROM node:22
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
EXPOSE 5000
CMD ["npm","start"]