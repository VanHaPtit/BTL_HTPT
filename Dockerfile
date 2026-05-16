FROM maven:3.9.9-eclipse-temurin-23 AS build
WORKDIR /app/backend

COPY backend/.mvn/ .mvn/
COPY backend/mvnw .
COPY backend/pom.xml .
RUN chmod +x mvnw && ./mvnw -q -Dmaven.test.skip=true dependency:go-offline

COPY backend/src src/
RUN ./mvnw -q -Dmaven.test.skip=true package

FROM eclipse-temurin:23-jre
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
