const cheerio = require('cheerio')
const puppeteer = require('puppeteer');
const fs = require('fs');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
} 

const rankDict = {
  "Iron" : 1,
  "Bronze" : 2,
  "Silver" : 3,
  "Gold" : 4,
  "Platinum" : 5,
  "Diamond" : 6,
  "Immortal" : 7,
  "Radiant" : 123456789
};

const rankColours = {
  "Iron" : "\x1b[30m\x1b[47m",
  "Bronze" : "\x1b[32m",
  "Silver" : "\x1b[37m",
  "Gold" : "\x1b[33m",
  "Platinum" : "\x1b[36m",
  "Diamond" : "\x1b[35m",
  "Immortal" : "\x1b[31m",
  "Radiant" : "\x1b[33m"
};

(async () => {
  let accounts
  try {
    accounts = JSON.parse(fs.readFileSync('accounts.json'));
  } catch (e) {
    accounts = {
      "accountList" : []
    }
  }
  while (true) {
    browser = await puppeteer.launch();
    
    const decision = await new Promise((resolve, reject) => {
      let bruh = readline.question('\nR for Ranks, A to Add Account, D to Delete Account\n', name => {
          return resolve(name);
      });
    });

    if (decision.toUpperCase() == "A") {
      while (true) {
        const username = await new Promise((resolve, reject) => {
          let bruh = readline.question('Input Username / Type "E" to Exit \n', name => {
            return resolve(name);
          });
        });
        if (username.toUpperCase() == "E") {
          break
        }
        const id = await new Promise((resolve, reject) => {
          let bruh = readline.question('Input ID\n', name => {
            return resolve(name);
          });
        });
        accounts.accountList.push([username, id])
        fs.writeFileSync('accounts.json', JSON.stringify(accounts));
        console.log("\n\x1b[42m" + username + "#" + id + " Has Been Added\x1b[0m\n")
      }

    } else if (decision.toUpperCase() == "D") {
      while (true) {
        if (accounts.accountList.length == 0) {
          console.log("\nERROR : No Accounts\n")
          break
        }

        for (i = 0; i < accounts.accountList.length; i++) {
          console.log(i+1 + ".) " + accounts.accountList[i][0] + "#" + accounts.accountList[i][1])
        }
        const selection = await new Promise((resolve, reject) => {
          let bruh = readline.question('\nInput # To Delete / Type "E" to Exit\n', name => {
            return resolve(name);
          });
        });
        if (selection.toUpperCase() == "E") {
          break
        }
        delAcc = accounts.accountList.pop(selection+1)
        console.log("\n\x1b[41m" + delAcc[0] + "#" + delAcc[1] + " Has Been Deleted\x1b[0m\n")
        fs.writeFileSync('accounts.json', JSON.stringify(accounts));
      }

    } else if (decision.toUpperCase() == "R") {
      if (accounts.accountList.length != 0) {
        let ranks = []
        for (i = 0; i < accounts.accountList.length; i++) {
          const page = await browser.newPage();
          await page.goto("https://tracker.gg/valorant/profile/riot/"+ accounts.accountList[i][0] + "%23" + accounts.accountList[i][1] +"/overview")
          await sleep(750);
          let html = await page.content();

          fs.writeFileSync('html.json', JSON.stringify(html));


          if (html.includes("We could not find the player")) {
            ranks.push(["ERROR : " + accounts.accountList[i][0] + "#" + accounts.accountList[i][1] + " Not Found", -2])
          } else if (html.includes("This profile is private.")) {
            ranks.push(["ERROR : " + accounts.accountList[i][0] + "#" + accounts.accountList[i][1] + " Is Private", 0])
          } else if (html.includes("has not played Valorant.")) {
            ranks.push(["ERROR : " + accounts.accountList[i][0] + "#" + accounts.accountList[i][1] + " Has Not Played Valorant", -1])
          }
          let $ = cheerio.load(await html);
          rank = $(".valorant-highlighted-stat__value").html()
          if (rank == "Radiant") {
            rankValue = rankDict[rank]
            ranks.push([accounts.accountList[i][0] + "#" + accounts.accountList[i][1] + " - " + rankColours[rank] + rank + "\x1b[0m", rankValue])
          } else {
              try {
                rankValue = rankDict[rank.split(" ")[0]] * rank.split(" ")[1]
                ranks.push([accounts.accountList[i][0] + "#" + accounts.accountList[i][1] + " - " + rankColours[rank.split(" ")[0]] + rank + "\x1b[0m", rankValue])
              } catch {
                ranks.push([accounts.accountList[i][0] + "#" + accounts.accountList[i][1] + " - Unranked / Rank Number Error", 0])
              }
          }
        }
        ranks.sort((a, b) => (a[1] > b[1]) ? 1 : -1)
        for (i = ranks.length-1; i >= 0; i--) {
          console.log(ranks[i][0])
        }
      } else {
        console.log("\nERROR : No Accounts\n")
      }

    
    } else {
      console.log("\nINVALID INPUT YOU FISH\n")
    }
  }
  
  


})();