const http = require("http");
const path = require("path");
const uuid = require("uuid");
const data = require("./db/books.json");

function handleAddBook() {
    console.log("Handled !");
}

const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;
  if (url === "/" && method === "GET") {
    res.end("<h1>Books home page</h1>");
  } else if (url === "/books" && method === "GET") {
    const htmlText = `
            <html>
              <head>
                <title>Books</title>
              </head>
              <body>
                 <h1>Books</h1>
                 <ol>
                    ${data?.map(
                      (book) => `<li>${book.title} - ${book.author} </li>`
                    )}
                 </ol>
                 <form action="/books" method="POST" style="
                    max-width: 50vw;
                    display:flex; 
                    flex-direction: column; 
                    gap: 1rem
                    ">
                        <h2 style="text-align: center">Yangi kitob qo'shish</h2> 
                        <input style="padding: 0.5rem;" type="text" name="book_name" placeholder="Kitob nomini kiriting" required />
                        <input style="padding: 0.5rem;" type="text" name="book_author" placeholder="Kitob avtorini kiriting" required />
                        <button style="padding: 0.5rem;">Saqlash</button>
                 </form>
              </body>
            </html> 
         `;

    res.end(htmlText);
  } else if(url === "/books" && method === "POST") {
        const data = []; 
        req.on("data", (chunk) => {
             console.log(chunk);
             data.push(chunk);
         });

         req.on("end", () => {
                const parsedBody = "";
         });
  }
  
  else {
     res.end(`<p style='text-align: "center"'>404 Sahifa topilmadi</p>`);
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});