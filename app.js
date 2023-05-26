const { google } = require('googleapis');
const express = require('express');
const app = express();

// Google Calendar credentials
const clientId = 'CLIENT_ID';
const clientSecret = 'SECRET';
const redirectUrl = 'REDIRECT_URL';
const scopes = ['https://www.googleapis.com/auth/calendar.readonly'];

// Step 1: Initiate the OAuth flow
app.get('/rest/v1/calendar/init', (req, res) => {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  res.redirect(authUrl);
});

// Step 2: Handle the redirect and fetch events
app.get('/rest/v1/calendar/redirect', async (req, res) => {
  const { code } = req.query;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { data } = await calendar.events.list({
      calendarId: 'primary', // 'primary' refers to the user's primary calendar
      timeMin: new Date().toISOString(),
      maxResults: 10, // Change this to the desired number of events
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = data.items.map((event) => ({
      id: event.id,
      summary: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
