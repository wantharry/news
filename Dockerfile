FROM nginx:1.27-alpine

# Remove the default Nginx static files.
RUN rm -rf /usr/share/nginx/html/*

# Copy app assets into the Nginx web root.
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
