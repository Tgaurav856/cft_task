const express = require('express');
const mysqlPool = require('./config/db');
require("dotenv").config();



const app = express();
const port = 9000;

app.use(express.json());


const router=require("./routes/route");
app.use("/api/v1",router);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

mysqlPool.query("SELECT 1").then(()=>{
    console.log("db connected");
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}).catch((error)=>{
    console.log(error)
})

