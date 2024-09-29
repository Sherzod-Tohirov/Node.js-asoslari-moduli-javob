const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { v4: uuidv4 } = require("uuid");
const db = require("./db/books.json");
const dbPath = path.join(__dirname, "db", "books.json");

function parseStringToObject(str) {
  const obj = {};
  str.split("&").forEach((pair) => {
    const data = pair.split("=");
    obj[data[0]] = data[1];
  });
  return obj;
}

function formatString(str) {
  return str.replaceAll("%27", "'");
}

function storeToDatabase(db) {
  const jsonDb = JSON.stringify(db, null, 2);

  try {
    fs.writeFileSync(dbPath, jsonDb);
    console.log("Data is stored to the database succeefully !");
  } catch (err) {
    console.log("Error while storing to the database: ", err);
  }
}

const server = http.createServer((req, res) => {
  const urlPath = req.url;
  const parsedUrl = url.parse(req.url, true);
  const getBookId = (parsedUrl) => {
    const pathname = parsedUrl.pathname.slice(1).split("/");
    if (pathname.includes("books")) {
      return String(pathname.at(-1));
    }
    return null;
  };
  const method = req.method;
  if (urlPath === "/" && method === "GET") {
    res.end(`
       <h1>Books home page</h1>
       <button><a href="/books">Books page</a></button>
    `);
  } else if (urlPath === "/books" && method === "GET") {
    const htmlText = `
            <html>
              <head>
                <title>Books</title>

                <style>
                    body {
                      margin: 0;
                      font-family: sans-serif;
                    }

                    main {
                      padding: 3rem;
                    }

                    li {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    }

                    button {
                       padding: 0.3rem 0.6rem;
                       color: white;
                       background-color: orange;
                       cursor: pointer;
                       border: #ccc;
                       border-radius: 1rem;
                    }

                    button:hover {
                       opacity: 0.8
                    }

                    dialog {
                      position: relative;
                    }
                  
                    dialog::backdrop {
                      background-color: rgba(0,0,0,0.6);
                    }

                    .dialog-close-btn {
                      position: absolute;
                      top: 0.5rem;
                      right: 0.5rem;
                      font-size: 1.4rem;
                      background-color: transparent;
                      border: none;
                      color: black;
                    }

                    .action-div {
                      display: flex;
                      align-items:center;
                      gap: 0.2rem;
                    }

                    .edit-dialog {
                      width: 35dvw;
                      min-width: 30rem;
                      padding: 1rem;
                    }


                </style>
              </head>
              <body>
                  <main>
                    <h1>Books</h1>
                 <ol>
                    ${db
                      ?.map(
                        (book, index) => `
                                 <li>
                                   <span>${index + 1})</span>
                                   <p>${book.title} - ${book.author}</p>
                                   <div class="action-div">
                                     <button style="background-color: blue;" onclick="(function(){
                                        const dialog = document.getElementById('editDialog');
                                        const form = document.getElementById('editForm');
                                        form.action = '/books/update/${
                                          book.id
                                        }';
                                        const titleInput = document.getElementById('editTitleInput');
                                        const authorInput = document.getElementById('editAuthorInput');
                                        titleInput.value = '${book.title
                                          .split("")
                                          .map((s) =>
                                            s.charCodeAt(0) === 39 ||
                                            s.charCodeAt(0) === 96
                                              ? String.fromCharCode(92) + s
                                              : s
                                          )
                                          .join("")}';
                                        authorInput.value = '${book.author
                                          .split("")
                                          .map((s) =>
                                            s.charCodeAt(0) === 39 ||
                                            s.charCodeAt(0) === 96
                                              ? String.fromCharCode(92) + s
                                              : s
                                          )
                                          .join("")}';
                                        dialog.showModal();
                                     })()">edit</button>
                                     <button style="background-color: red;" onclick="(function(){
                                         const confirmation = confirm('Iltimos tasdiqlang !');
                                         if(confirmation) {
                                             const form = document.createElement('form');
                                             const body = document.querySelector('body');
                                             form.action = '/books/delete/${
                                               book.id
                                             }';
                                             form.method = 'POST';
                                             body.appendChild(form);
                                             form.submit();
                                         }
                                        
                                     
                                     })()">delete</button>
                                   </div>
                                 </li>`
                      )
                      .join("") || "<span style='opacity: 0.4; pointer-events: none'>Kitoblar hozircha mavjud emas.</span>"}
                 </ol>
                 <form action="/books" method="POST" style="
                    max-width: 50vw;
                    display:flex; 
                    flex-direction: column; 
                    gap: 1rem
                    ">
                        <h2 style="text-align: center">Yangi kitob qo'shish</h2> 
                        <input style="padding: 0.5rem;" type="text" name="title" placeholder="Kitob nomini kiriting" required />
                        <input style="padding: 0.5rem;" type="text" name="author" placeholder="Kitob avtorini kiriting" required />
                        <button style="padding: 0.5rem;">Saqlash</button>
                 </form>
                 <dialog id="editDialog" class="edit-dialog">
                   <button id="closeBtn" class="dialog-close-btn" onclick="(function() {
                       const dialog = document.getElementById('editDialog');
                       dialog.close();
                   })()">&times;</button>
                   <form id="editForm" method="POST" style="
                    width: 100%;
                    display:flex; 
                    flex-direction: column; 
                    gap: 1rem
                    ">
                        <h2 style="text-align: center">Kitobni tahrirlash.</h2> 
                        <input id="editTitleInput" style="padding: 0.5rem;" type="text" name="title" placeholder="Kitob nomini kiriting" required />
                        <input id="editAuthorInput" style="padding: 0.5rem;" type="text" name="author" placeholder="Kitob avtorini kiriting" required />
                        <button style="padding: 0.5rem;">Saqlash</button>
                 </form>
                 </dialog>
                  
                  </main>
              </body>
            </html> 
         `;

    res.end(htmlText);
  } else if (urlPath === "/books" && method === "POST") {
    const data = [];
    req.on("data", (chunk) => {
      data.push(chunk);
    });

    req.on("end", () => {
      const parsedBody = Buffer.concat(data).toString();
      const jsonData = parseStringToObject(parsedBody);
      if (!jsonData?.title || !jsonData?.author) {
        res.end("Iltimos ma'lumotlarni kiriting !");
      }
      const isBookExist = db.find((book) => book.title === jsonData.title);
      if (isBookExist) {
        res.end(`
            <p>Bu kitob ro'yxatda allqachon mavjud !</p>
            <button><a href="/books">Ortga qaytish</a></button>
          `);
      } else {
        db.push({
          id: uuidv4(),
          title: jsonData.title,
          author: jsonData.author,
        });
        storeToDatabase(db);
        if (!req.headersSent) {
          res.writeHead(301, { Location: "/books" });
        }
        res.end("<p>Ma'lumotlar saqlandi !</p>");
      }
    });
  } else if (urlPath.startsWith("/books/update/") && method === "POST") {
    const bookId = getBookId(parsedUrl);
    const foundBook = db.find((book) => book.id == bookId);
    if (foundBook) {
      const data = [];
      req.on("data", (chunk) => {
        data.push(chunk);
      });

      req.on("end", () => {
        const parsedBody = Buffer.concat(data).toString();
        const parsedData = parseStringToObject(parsedBody);
        foundBook.title = formatString(parsedData.title);
        foundBook.author = formatString(parsedData.author);
        storeToDatabase(db);
      });

      if (!req.headersSent) {
        res.writeHead(301, { Location: "/books" });
        res.end();
      } else {
        res.end();
      }
    }
  } else if (
    urlPath.startsWith("/books/delete/") &&
    getBookId(parsedUrl) &&
    method === "POST"
  ) {
    const bookId = getBookId(parsedUrl);
    const index = db.findIndex(
      (book) => String(book.id) === String(bookId)
    );
    db.splice(index, 1);
    storeToDatabase(db);
    if (!req.headersSent) {
      res.writeHead(301, { Location: "/books" });
      res.end();
    } else {
      res.end();
    }
  } else {
    res.end(`<div style='
              height: 90dvh; 
              display: flex; 
              align-items:center; 
              justify-content: center; 
              font-size: 2.2rem; 
              font-family: monospace'>404 sahifa topilmadi!</div>`);
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
