const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// require("crypto").randomBytes(64).toString("hex")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Jwt verify
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden' });
    }
    console.log('Decoded', decoded);
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clusterenvantory.w8qznwv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const run = async () => {
  try {
    await client.connect();
    const productCollection = client.db('envantory').collection('products');
    const myProductCollection = client.db('envantory').collection('myProducts');

    app.get('/product', async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // get My Product
    app.get('/myProduct', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail == email) {
        const query = { email: email };
        const cursor = myProductCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        return res.status(403).send({ message: 'Forbidden' });
      }
    });

    // Particular Product
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });
    // Particular My Product
    app.get('/myProduct/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await myProductCollection.findOne(query);
      res.send(product);
    });

    // POST
    app.post('/product', async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });
    // POST
    app.post('/myProduct', async (req, res) => {
      const newProduct = req.body;
      const result = await myProductCollection.insertOne(newProduct);
      res.send(result);
    });
    // POST AUTH
    app.post('/tokenLogin', async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      });
      res.send(accessToken);
    });
    // Update
    app.put('/product/:id', async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: parseInt(updatedProduct.quantity),
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    //Delete
    app.delete('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    app.delete('/myProduct/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await myProductCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
};
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Electronic envantory server');
});

app.listen(port, () => {
  console.log('Server is running on the port:', port);
});
