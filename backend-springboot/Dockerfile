FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn -s .mvn/settings.xml clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY start-render.sh start-render.sh
RUN chmod +x start-render.sh
EXPOSE 8080
ENTRYPOINT ["./start-render.sh"]
