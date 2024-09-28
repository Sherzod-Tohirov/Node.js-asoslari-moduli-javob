const http = require("http");
const fs = require("fs");
const path = require("path");
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

const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;
  console.log("url: ", url);
  console.log("method: ", method);
  if (url === "/" && method === "GET") {
    res.end(`
       <h1>Books home page</h1>
       <button><a href="/books">Books page</a></button>
    `);
  } else if (url === "/books" && method === "GET") {
    const htmlText = `
            <html>
              <head>
                <title>Books</title>
                <style>
                    li {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    }

                    button {
                       color: white;
                       background-color: orange;
                       cursor: pointer;
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


                </style>
              </head>
              <body>
                 <h1>Books</h1>
                 <ol>
                    ${db?.map(
                      (book, index) => `
                                 <li>
                                   <span>${index + 1})</span>
                                   <p>${book.title} - ${book.author}</p>
                                   <div class="action-div">
                                     <button style="background-color: blue;" onclick="(function(){
                                        const dialog = document.getElementById('editDialog');
                                        console.log(dialog);
                                        const form = document.getElementById('editForm');
                                        form.action = '/books/${book.id}';
                                        const titleInput = document.getElementById('editTitleInput');
                                        const authorInput = document.getElementById('editAuthorInput');
                                        titleInput.value = '${book.title.replaceAll('\'', '')}';
                                        authorInput.value = '${book.author.replaceAll('\'', '')}';
                                        console.log(form);
                                        dialog.showModal();
                                     })()">edit</button>
                                     <button style="background-color: red;">delete</button>
                                   </div>
                                 </li>`
                    ).join("")}
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
                 <dialog id="editDialog">
                   <button id="closeBtn" class="dialog-close-btn" onclick="(function() {
                       const dialog = document.getElementById('editDialog');
                       dialog.close();
                   })()">&times;</button>
                   <form id="editForm" method="POST" style="
                    max-width: 40vw;
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
              </body>
            </html> 
         `;

    res.end(htmlText);
  } else if (url === "/books" && method === "POST") {
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
      console.log("json: ", jsonData);
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
        const jsonDb = JSON.stringify(db, null, 2);

        try {
          fs.writeFileSync(dbPath, jsonDb);
          console.log("Data is stored to the database succeefully !");
        } catch (err) {
          console.log("Error while storing to the database: ", err);
        }

        if (!req.headersSent) {
          res.writeHead(301, { Location: "/books" });
        }
        res.end("<p>Ma'lumotlar saqlandi !</p>");
      }
      console.log("db: ", db);
    });
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
