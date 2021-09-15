const https = require('https')
const Node = require('./datastructures/Node.js')

const startTime = performance.now()
getNodes(function(json) { // 1)

    let root = buildTree(json) // 2)

    let answer = traverseTree(root, json.key) // 3)
    console.log(`\nKEY: ${json.key}`)
    console.log(`RESULT: ${answer}`)

    postAnswer(answer, function(statusCode) { // 4)
        console.log(`Status code: ${statusCode}`)
        if(statusCode == 200) {
            console.log("Correct answer!")
        }
        else if(statusCode == 400) {
            console.log("Incorrect answer.")
        }
        console.log(`Finished in ${performance.now() - startTime}ms\n`);
    })
})

/**
 * 1)
 * Fetches the JSON Object from the server and calls the callback function with the parsed JSON object.
 * @param {Function} callback Callback function which shall be called when the request succeeds.
 */
function getNodes(callback) {
    https.get("https://vello-nutcracker-2021.herokuapp.com/task", (response) => {
        let responseData = ''

        response.on("data", function(chunk) {
            responseData += chunk
        })

        response.on("end", () => {
            try {
                var json = JSON.parse(responseData)
            }
            catch(error) {
                console.error(`Invalid json. Message: ${error}`)
            }
            if(json != null) {
                callback(json)
            }
        })

    }).on("error", (error) => {
        console.error(error.message)
    }).end()
}

/**
 * 2.1)
 * Builds a tree from a JSON object.
 * @param {JSON Object} json The JSON object containing all the nodes.
 * @returns The root of the tree.
 */
function buildTree(json) {
    for(var i = 0; i < json.nodes.length; i++) {
        if(json.nodes[i].parent == '') {
            var root = new Node(json.nodes[i])
            break
        }
    }
    findChildren(root, json.nodes)
    return root
}

/**
 * 2.2)
 * Recursive metho which finds the children to the selected parent node.
 * @param {Node} parent Parent to the node we're looking for.
 * @param {node[] from JSON object} nodesArray Array containing the nodes which were gathered from the JSON object.
 */
function findChildren(parent, nodesArray) {
    let children = []

    // Checks through all the nodes. This could find any number of children depending on the fetched JSON object.
    for(let i = 0; i < nodesArray.length; i++) {
        if(nodesArray[i].parent == parent.data.id) {
            children.push(nodesArray[i])
        }
    }

    // Place the children to their parent's left or right depending on their weight.
    // This is where it goes very wrong if the JSON Object has one of the following:
    //      More than two nodes with the same parent.
    //      More than one node with an even weight.
    //      More than one node with an odd weight.
    children.forEach(function(element) {
        let childNode = new Node(element)

        // Even weight.
        if(element.weight % 2 == 0) {
            parent.left = childNode
        }
        // Odd weight.
        else {
            parent.right = childNode
        }
        // findGrandchildren.
        findChildren(childNode, nodesArray)
    })
}

/**
 * 3.1)
 * Traverses the tree to find the encoded phrase.
 * @param {Node} node The root node. Ideally this one should not have any parents.
 * @returns A string with the result from the assignment's solution.
 */
function traverseTree(node, key) {
    let level = 1
    let answer = []
    while(getLevel(node, level, answer, key)) {
        level++
    }
    return answer.join('')
}

/**
 * 3.2)
 * Recursive method that prints one level of a binary tree at a time.
 * @param {Node} node The next node.
 * @param {int} level Current depth.
 * @param {string[]} answer Array of strings that will later be joined.
 * @returns True when it's reached the printing level, false if the next node doesn't exist.
 */
function getLevel(node, level, answer, key) {
    if(node == null) {
        return false
    }
    if(level == 1) {
        answer.push(key.charAt(node.data.value))
        return true
    }
    let leftNode = getLevel(node.left, level - 1, answer, key)
    let rightNode = getLevel(node.right, level - 1, answer, key)
    return leftNode || rightNode
}

/**
 * Sends a POST request to the server containing the answer to the assignment.
 * @param {string} answer The answer for the assignment.
 * @param {Function} callback To let the caller know the request has received a response.
 */
function postAnswer(answer, callback) {

    // The body:
    const data = JSON.stringify({
        "answer": answer
    })

    const options = {
        hostname: "vello-nutcracker-2021.herokuapp.com",
        port: 443,
        path: '/task',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }

    let request = https.request(options, response => {
        response.on('data', d => {
            process.stdout.write(d) // Should be empty if the answer is correct.
        })
        callback(response.statusCode)
    })
    request.on("error", (error) => {
        console.error(error.message)
    })

    console.log(`Posting with body: ${data}`)
    request.write(data)
    request.end()
}