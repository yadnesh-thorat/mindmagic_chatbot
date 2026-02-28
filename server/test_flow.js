import axios from "axios";

async function test_flow() {
    try {
        const email = `test_${Date.now()}@test.com`;
        const password = "password123";

        console.log("Registering...");
        await axios.post("http://localhost:5000/register", {
            email, password, language: "English"
        });

        console.log("Logging in...");
        const loginRes = await axios.post("http://localhost:5000/login", {
            email, password
        });
        const token = loginRes.data.token;
        console.log("Logged in, token obtained.");

        console.log("Sending entry...");
        const entryRes = await axios.post("http://localhost:5000/entry", {
            text: "I am feeling a bit stressed today",
            stress: 4,
            energy: 2,
            language: "English"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Entry response:", entryRes.data);
    } catch (error) {
        console.error("Flow failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

test_flow();
