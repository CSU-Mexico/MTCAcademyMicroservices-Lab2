import { Request, Response, NextFunction } from 'express'; 
const util = require("util"); 
const mysql = require('mysql');
const sendgrid = require('@sendgrid/mail');

interface Notification {    
    NotificationDate: Date;
    ExpenseId: Number;
}

interface ExpenseRecord {
    id: Number;
    date: Date;
    amount: Number;
    category: String;

}

//use email service
function sendEmail(date: Date, amount: Number, category: String) {
    let result: boolean = false;
    const SENDGRID_API_KEY = "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"

    sendgrid.setApiKey(SENDGRID_API_KEY);
    const content = `<strong> Fecha : ${date}- Monto: $ ${amount.toString()} - Concepto: ${category} </strong>`;  

    const msg = {
        to: 'e_ramirez_martinez@hotmail.com',
        // Change to your recipient
        from: 'mtcacademyms@outlook.com',
        // Change to your verified sender
        subject: 'Gasto Registrado ',
        text: `Acabas de realizar un gasto por $ ${amount.toString()} `,
        html: content,
    }
    sendgrid
        .send(msg)
        .then((resp) => {
            console.log('Email sent\n', resp)
        })
        .catch((error) => {
            console.error(error)
        })
    result = true;
    return result;
}

//register in database 
async function registerExpensesNotification (notification: Notification){

    let result:boolean = false;
    
    var connection = mysql.createConnection({
        host: "mtcacademymysql.mysql.database.azure.com",
        port:"3306",
        user: "adminadmin",
        password: ".Microsoft01.",
        database: "expensenotificationdb"
    });

    connection.query = util.promisify(connection.query).bind(connection);

    connection.connect(function (err) {
        if (err) {
            console.log("error connecting: " + err.stack);
            return;
        };
        console.log("connected as... " + connection.threadId);
    });
    
    const postQueryString = `INSERT INTO expensenotificationdb.notification  (NotificationDate, ExpenseId) VALUES (' ${formatDate(notification.NotificationDate)}',${notification.ExpenseId.toString() } )`;  

    const resultquery = await connection.query(postQueryString).catch(err => { throw err });
    
    result = true;
    return result;
};

async function sendExpenseNotification(data:string) {
    let expense: ExpenseRecord = JSON.parse(data);
    let date: Date = expense.date;
    let amount: Number = expense.amount;
    let category: String = expense.category;
    let id: Number = expense.id
    // sending the email notification

    let resultEmail = sendEmail(date, amount, category);


    let currentDate = new Date(Date.now());;

    let notification: Notification = {
        NotificationDate: currentDate,
        ExpenseId: id
    };

    let resultRegister = await registerExpensesNotification(notification);

}


function formatDate(date: Date) {
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join(':')
    );
}

function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

export default { sendExpenseNotification };