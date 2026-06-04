FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

COPY pom.xml .
RUN mvn -q -Dmaven.test.skip=true dependency:go-offline

COPY src ./src
RUN mvn -q -Dmaven.test.skip=true package && cp target/*.jar /app.jar

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app.jar app.jar

EXPOSE 8080

RUN addgroup -S capitally && adduser -S capitally -G capitally
USER capitally

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
