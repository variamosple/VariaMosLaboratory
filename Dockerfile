FROM node:16-alpine as build

# Set the working directory in the container
WORKDIR /app

# update packages
RUN apk update

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

# copy source code to /app folder
COPY ./ . 
COPY .env ./ 
# compile
RUN npm run build


# Use a lightweight Nginx image as a base image for the production environment
FROM nginx:alpine

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React application from the builder stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 3000 for the Nginx server
EXPOSE 3000

# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
