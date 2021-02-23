import crawlMothering from "./mothering.js";

/*
async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log("connected to server");
  } finally {
    console.log("in the finally.");
    await client.close();
  }
}

// run().catch(console.dir);
//
//
*/
crawlMothering().catch(console.dir);
