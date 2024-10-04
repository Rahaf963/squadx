const express = require("express");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios"); // Axios to make requests to Wix backend
const app = express();

app.use(express.json()); // This middleware parses JSON bodies

// Generate a dynamic form link with UUID and send form data to Wix
app.post("/generate-form", async (req, res) => {
  const formId = uuidv4(); // Generate unique UUID
  const amount = req.body.amount; // Generate random amount
  const postUrl = req.body.url; // Example post URL
  const email = req.body.email; // Example post URL
  const phone = req.body.phone; // Example post URL
  const name = req.body.name; // Example post URL
  const wix = req.body.wix; // Example post URL   

  // Send the form details to the Wix backend to insert into the database
  try {
    const response = await axios.post(
      "https://www.squadx.org/_functions/insertFormData",
      {
        formId: formId,
        amount: amount,
        postUrl: postUrl,
        email: email,
        phone: phone,
        name: name,
        wix: wix,
      }
    );
    
    if (response.data.success) {
      const dynamicLink = `https://squadx.c/form/${formId}`;
      res.send(dynamicLink);
    } else {
      res.status(500).send("Failed to insert form details");
    }
  } catch (error) {
    res.status(500).send(`Error inserting form details: ${error.message}`);
  }
});

// Serve the form dynamically by fetching details from Wix backend
app.get("/form/:formId", async (req, res) => {
  const formId = req.params.formId;
  console.log(`Fetching details for formId: ${formId}`);

  try {
    // Fetch form details from Wix backend using formId
    const response = await axios.post(
      `https://www.squadx.org/_functions/fetchFormDetails?formId=${formId}`
    );

    // Log the entire response for debugging purposes
    console.log("Response from Wix:", response.data);

    // Check if the API response indicates success
    if (response.data && response.data.success) {
      const formDetails = response.data.formDetails;
      console.log(`Form details retrieved:`, formDetails);

      // Generate the dynamic HTML form with fetched details
      const formHTML = `
              <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Spaceremit Payment Integration</title>
    <meta
      name="spaceremit-verification"
      content="0TYZGDD5T8RNGZTGT6MI6F3VM1AG5L1JLPJ5IRG92LTXHQ3U31"
    />
     <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #000;
    }

    form {
      width: 400px;
      padding: 20px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    button {
      background-color: #000;
      color: white;
      font-size: 1.2rem;
      padding: 15px 20px;
      width: 100%;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    button:hover {
      background-color: #218838;
    }
  </style>

    <!-- Define your script variables before including spaceremit.js -->
  </head>
  <body>
    <!-- Payment form start -->
    <form id="spaceremit-form" style="width: 400px; padding: 10px" action="/redirect?url=${formDetails.potUrl}">
      <!-- Hidden input fields for amount and currency -->
      <input type="hidden" name="amount" value="${formDetails.amount}" />
      <input type="hidden" name="currency" value="USD" />

      <!-- Hidden input fields for buyer's information -->
      <input type="hidden" name="fullname" value="${formDetails.name}" />
      <input type="hidden" name="email" value="${formDetails.email}" />
      <input type="hidden" name="phone" value="${formDetails.phone}" />

      <!-- Local payment methods option -->
      <div class="sp-one-type-select">
        <input
          type="radio"
          name="sp-pay-type-radio"
          value="local-methods-pay"
          id="sp_local_methods_radio"
          checked
        />
        <label for="sp_local_methods_radio">Local payment methods</label>
        <!-- Container for local payment methods -->
        <div id="spaceremit-local-methods-pay"></div>
      </div>


      <!-- Submit button -->
      <button type="submit">Pay</button>
    </form>
    <!-- Payment form end -->
    <script>
      const SP_PUBLIC_KEY =
        "pkZO53EFEHPUDEN6JLEGK0P7HAE63SJ5TBYXL4QO2N8VKIRO5E7A"; // Replace with your actual public key
      const SP_FORM_ID = "#spaceremit-form"; // Make sure this matches the form ID
      const SP_SELECT_RADIO_NAME = "sp-pay-type-radio"; // Radio button group name

      const LOCAL_METHODS_BOX_STATUS = true; // Enable/disable local payment methods box
      const LOCAL_METHODS_PARENT_ID = "#spaceremit-local-methods-pay"; // ID of local payment methods container

      const CARD_BOX_STATUS = true; // Enable/disable card payment box
      const CARD_BOX_PARENT_ID = "#spaceremit-card-pay"; // ID of card payment container
      let SP_FORM_AUTO_SUBMIT_WHEN_GET_CODE = true; // Automatically submit the form after getting a code

      // Callback for successful payment
      function SP_SUCCESSFUL_PAYMENT(spaceremit_code) {
        console.log("Payment successful with code: ", spaceremit_code);
      }

      // Callback for failed payment
      function SP_FAILD_PAYMENT() {
        console.log("Payment failed.");
      }

      // Callback for receiving message
      function SP_RECIVED_MESSAGE(message) {
        alert(message);
      }

      // Callback for needing authentication
      function SP_NEED_AUTH(target_auth_link) {
        console.log(
          "Authentication needed, follow this link: ",
          target_auth_link
        );
      }
    </script>

    <!-- Spaceremit API script -->
    <script src="https://spaceremit.com/api/v2/js_script/spaceremit.js"></script>
  </body>
</html>

          `;

      // Send the generated form HTML back to the client
      return res.send(formHTML);
    } else {
      // Handle case where form is not found
      console.log(`Form not found for formId: ${formId}`);
      return res.status(404).send("Form not found");
    }
  } catch (error) {
    console.error(`Error getting form details: ${error.message}`);
    console.log(`Full error:`, error.response ? error.response.data : error);
    // Send back a generic error message
    return res
      .status(500)
      .send("Error retrieving form details. Please try again later.");
  }
});


app.get('/redirect', async (req, res) => {
  const { email, SP_payment_code } = req.query;

  // Perform your redirect logic here
  if (email) {
    try {
      const response = await axios.post(
        `https://www.squadx.org/_functions/fetchFormDetailsEmail?formId=${email}&code=${SP_payment_code}`
      );

      // Log the entire response for debugging purposes
      console.log("Response from Wix:", response.data);

      // Check if the API response indicates success
      if (response.data && response.data.success) {
        const formDetails = response.data.formDetails;
        console.log(`Form details retrieved:`, formDetails);

        // Construct the redirect URL
        const redirectUrl = formDetails.postUrl;
        
        // Redirect to the specified URL
        return res.redirect(redirectUrl);
      } else {
        return res.status(400).send('Failed to retrieve form details');
      }
    } catch (error) {
      console.error(`Error getting form details: ${error.message}`);
      console.log(`Full error:`, error.response ? error.response.data : error);
      // Send back a generic error message
      return res.status(500).send("Error retrieving form details. Please try again later.");
    }
  } else {
    return res.status(400).send('Missing email parameter');
  }
});


// Start the Express server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});



