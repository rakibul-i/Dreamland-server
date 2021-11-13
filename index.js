const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 7070;
const { MongoClient } = require("mongodb");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;

const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// mongo uri
const uri = `
mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.upkhf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// connet to database
const dreamLandDB = async () => {
  try {
    await client.connect();
    const database = client.db("dreamland");
    const apartmentsCollection = database.collection("appartments");
    const orders = database.collection("orders");
    const users = database.collection("users");
    const reviews = database.collection("reviews");

    // apartments collection apis starts ------------------------//

    // get all apartments
    app.get("/apartments", async (req, res) => {
      const cursor = apartmentsCollection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      const count = await cursor.count();
      let apartments;
      if (page) {
        apartments = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        apartments = await cursor.toArray();
      }
      res.json({ count, apartments });
    });

    // get apartment details by id
    app.get("/apartments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await apartmentsCollection.findOne(query);
      res.json(result);
    });

    // post apartment
    app.post("/apartments", async (req, res) => {
      const apartmentData = req.body;
      const result = await apartmentsCollection.insertOne(apartmentData);
      res.json(result);
    });

    // delete apartment by id
    app.delete("/apartments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await apartmentsCollection.deleteOne(query);
      res.send(result);
    });

    // apartments collection apis ends ------------------------//

    // orders collection apis starts ------------------------//

    // get  user orders
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      if (email) {
        const query = { email: email };
        const cursor = orders.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        const cursor = orders.find({});
        const result = await cursor.toArray();
        res.json(result);
      }
    });

    // post order
    app.post("/orders", async (req, res) => {
      const orderDetails = req.body;
      const result = await orders.insertOne(orderDetails);
      res.send(result);
    });

    // update order stutus
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.updatedStatus;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await orders.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // delete order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orders.deleteOne(query);
      res.send(result);
    });

    // orders collection apis ends ------------------------//

    // users collection apis starts ------------------------//

    // get all users
    app.get("/users", async (req, res) => {
      const cursor = users.find({});
      const result = await cursor.toArray();
      res.send(result);
    });

    // get admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await users.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // post user
    app.post("/users", async (req, res) => {
      const userDetails = req.body;
      const result = await users.insertOne(userDetails);
      res.json(result);
    });

    // insert or upsert user information
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await users.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // make admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;

      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await users.updateOne(filter, updateDoc);
      res.json(result);
    });

    // users collection apis ends ------------------------//

    // reviews collection apis starts ------------------------//

    // get all reviews
    app.get("/reviews", async (req, res) => {
      const cursor = reviews.find({});
      const result = await cursor.toArray();
      res.json(result);
    });

    // post review
    app.post("/review", async (req, res) => {
      const reviewDetails = req.body;
      const review = await reviews.insertOne(reviewDetails);
      res.json(review);
    });
  } finally {
    // await client.close();
  }
};

dreamLandDB().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log("listening on port", port);
});
