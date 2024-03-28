import { ServerBootstrap } from "./serverBootstrap";

async function bootstrap() {
    const server = new ServerBootstrap()
    await server.start();
}

bootstrap();
