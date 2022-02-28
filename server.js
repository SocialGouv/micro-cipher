import { createServer } from "http"
import { generateKeyPair, privateDecrypt } from "crypto"
import { promisify } from "util"

// Generate a one-run RSA key pair
const { publicKey, privateKey } = await promisify(generateKeyPair)('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
})

// Print the public key to the admin who just started this app
console.log(publicKey)
console.log("Encrypt your secrets using this key and the folowing openssl command:")
console.log(' echo "<token>" | openssl rsautl -encrypt -oaep -pubin -inkey <rsa_public_key_file> -out github_token.enc')
console.log("^ be careful to keep this space at the beginning of the command to keep the token out of the bash history")

// Start a server to decrypt on demand
const requestListener = async (req, res) => {
  const dataBuffers = []

  // We might receive data in multiple chunks
  for await (const chunk of req) {
    dataBuffers.push(chunk)
  }
  const dataBuffer = Buffer.concat(dataBuffers)

  // Send back decrypted data using the in-memory key
  res.writeHead(200)
  res.end(privateDecrypt(privateKey, dataBuffer).toString())
}

const server = createServer(requestListener)
server.listen(3000)
