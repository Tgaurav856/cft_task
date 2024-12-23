const mysql=require("mysql2/promise");

const mysqlPool=mysql.createPool({
    host:"localhost",
    user:"root",
    password:"Gaurav@123",
    database:"gauravdb",
});
module.exports=mysqlPool;