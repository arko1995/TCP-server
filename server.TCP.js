import net from "net";
function createWebServer(requestHandler) {
  const server = net.createServer();

  server.on("connection", handleFunction);

  function handleFunction(socket) {
    socket.once("readable", () => {
      let reqBuffer = Buffer.from("");

      let buf;
      let reqHeader;

      while (true) {
        buf = socket.read();

        if (buf === null) break;

        reqBuffer = Buffer.concat([reqBuffer, buf]);

        let marker = reqBuffer.indexOf("\r\n\r\n");

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

      let status = 200,
        statusText = "OK",
        headersSent = false,
        isChunked = false;

      const responseHeaders = {
        server: "my-custom-server",
      };

      function setHeader(key, value) {
        responseHeaders[key.toLowerCase()] = value;
      }

      function sendHeaders() {
        if (!headersSent) {
          headersSent = true;
          setHeader("date", new Date().toUTCString());
          socket.write(`HTTP/1.1 ${status} ${statusText} \r\n`);
          Object.keys(responseHeaders).forEach((headerKey) => {
            socket.write(`${headerKey}:${responseHeaders[headerKey]}\r\n`);
          });
          socket.write("\r\n");
        }
      }

      const response = {
        write(chunk) {
          if (!headersSent) {
            if (!responseHeaders["content-length"]) {
              isChunked = true;
              setHeader("transfer-encoding", "chunked");
            }
            sendHeaders();
          }
          if (isChunked) {
            const size = chunk.length.toString(16);
            socket.write(`${size}\r\n`);
            socket.write(chunk);
            socket.write("\r\n");
          } else {
            socket.write(chunk);
          }
        },
        end(chunk) {
          if (!headersSent) {
            if (!responseHeaders["content-length"]) {
              setHeader("content-length", chunk ? chunk.length : 0);
            }
            sendHeaders();
          }
          if (isChunked) {
            if (chunk) {
              const size = chunk.length.toString(16);
              socket.write(`${size}\r\n`);
              socket.write(chunk);
              socket.write("\r\n");
            }
            socket.end("0\r\n\r\n");
          } else {
            socket.end(chunk);
          }
        },
        setHeader,
        setStatus(newStatus, newStatusText) {
          ((status = newStatus), (statusText = newStatusText));
        },
        json(data) {
          if (headersSent) {
            throw new Error(`Header sen, cannot proceed to send json`);
          }
          const json = Buffer.from(JSON.stringify(data));
          setHeader("content-type", "application/json; charset=utf-8");
          setHeader("content-length", json.length);
          sendHeaders();
          socket.end(json);
        },
      };
      requestHandler(request, response);
    });
  }
  return {
    listen: (port) => server.listen(port),
  };
}

const webServer = createWebServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  res.setHeader("Content-type", "text/plain");
  res.end("Hello World");
});
webServer.listen(5000);
