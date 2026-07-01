import net from "net";

const server = net.createServer();

server.on("connection", handleFunction);

server.listen(5000);

const handleFunction = (socket) => {
  socket.once("readable", () => {
    let reqBuffer = Buffer.from("");

    let buf;
    let reqHeader;

    while (true) {
      buf = socket.read();

      if (buf === null) break;

      reqBuffer = Buffer.concat([reqBuffer, buf]);

      let marker = reqBuffer.indexOf("/r/n/r/n");

      if (marker !== -1) {
        let remaining = reqBuffer.slice(marker + 4);

        reqHeader = reqBuffer.slice(0, marker).toString();

        socket.unshift(remaining);
        break;
      }
    }

    const reqHeaders = reqHeader.split("\r\n");
    console.log(reqHeaders);

    const reqLine = reqHeaders.shift().split(" ");
    console.log(reqLine);

    const headers = reqHeaders.reduce((acc, currentHeader) => {
      const index = currentHeader.indexOf(":");
      const key = currentHeader.slice(0, index);
      const value = currentHeader.slice(index + 1);
      return {
        ...acc,
        [key.trim().toLowerCase()]: value.trim(),
      };
    }, {});

    const request = {
      method: reqLine[0],
      url: reqLine[1],
      httpVersion: reqLine[2].split("/"),
      headers,
      socket,
    };
  });
};
