# Same base as VariaMosAdmin and variamos_ms_laboratory; Node 16 is end of life
FROM node:24-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Dependencies first: a change of the source code reuses this layer
COPY package.json package-lock.json ./
RUN npm ci

# Source code, with the .env file written by the deployment workflow: the
# addresses of the services are built into the interface (see .env.example)
COPY ./ .
RUN test -f .env || (echo "Write .env before building the image (see .env.example)" && exit 1)
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
