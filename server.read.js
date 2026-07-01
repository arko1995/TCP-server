import net from "net";

const server = net.createServer();

server.on("connection", handleFunction);
server.listen(5000);

function handleFunction(socket) {
  socket.once("readable", () => {
    let reqBuffer = Buffer.from("");
    console.log(reqBuffer);
    let buf;
    let reqHeader;

    while (true) {
      buf = socket.read();

      if (buf === null) break;

      reqBuffer = Buffer.concat([reqBuffer, buf]);
      console.log(reqBuffer);

      let marker = reqBuffer.indexOf("\r\n\r\n");

      if (marker !== -1) {
        let remaining = reqBuffer.slice(marker + 4);

        reqHeader = reqBuffer.slice(0, marker).toString();

        socket.unshift(remaining);

        break;
      }
    }

    console.log(`Request Header:\n ${reqHeader}`);

    reqBuffer = Buffer.from("");
    while ((buf = socket.read()) !== null) {
      reqBuffer = Buffer.concat([reqBuffer, buf]);
    }

    let reqBody = reqBuffer.toString();

    console.log(`Request Body:\n ${reqBody}`);
  });
}
