# SpeechForms - Voice-Enabled Form Builder

Create intelligent forms where users can speak their responses instead of typing. Powered by OpenAI's Whisper speech-to-text technology for seamless data collection.

## 🚀 Features

- **Voice-First Experience**: Users can speak their responses naturally
- **Flexible Form Builder**: Create custom forms with various field types
- **AI-Powered Accuracy**: Powered by OpenAI's Whisper for industry-leading speech recognition
- **Real-time Transcription**: Instant speech-to-text conversion
- **Modern UI**: Beautiful, responsive design built with Next.js and Tailwind CSS
- **Form Management**: Create, edit, duplicate, and manage forms
- **Response Collection**: Store and view form responses
- **Demo Mode**: Try the functionality without creating forms

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast
- **Speech-to-Text**: OpenAI Whisper API
- **Storage**: localStorage (easily replaceable with database)

## 📋 Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## 🚀 Getting Started

1. **Clone and install dependencies**:
```bash
git clone <your-repo-url>
cd speech-form
npm install
```

2. **Set up environment variables**:
Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Run the development server**:
```bash
npm run dev
```

4. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 How to Use

### Creating Forms
1. Go to the Dashboard (`/dashboard`)
2. Click "Create Form"
3. Add form title and description
4. Add fields using the sidebar (text, email, phone, date, multiple choice, etc.)
5. Configure field labels, placeholders, and requirements
6. Save your form

### Filling Forms
1. Share the form URL with users
2. Users can either type responses OR use voice input
3. Click the microphone button to start recording
4. Speak clearly and click stop when done
5. Speech is automatically transcribed to text
6. Submit the completed form

### Managing Forms
- **View Forms**: See all your forms in the dashboard
- **Edit Forms**: Modify existing forms
- **Duplicate Forms**: Copy forms to create variants
- **Delete Forms**: Remove unwanted forms
- **Copy Links**: Share form URLs easily
- **View Responses**: Check submitted responses

## 🎯 Voice Input Tips

For best speech recognition results:
- Speak clearly and at a normal pace
- Use a quiet environment
- Say "period" or "comma" for punctuation
- For emails, say "john dot smith at gmail dot com"
- For multiple choice, speak the exact option name
- Click stop when you finish speaking

## 🌟 Demo

Try the demo at `/demo` to experience voice-enabled forms without creating an account. The demo includes:
- Text input fields
- Email fields with voice recognition
- Multiple choice with smart matching
- Long text areas for detailed responses
- Real-time response preview

## 🔧 API Endpoints

### POST `/api/transcribe`
Transcribes audio to text using OpenAI Whisper.

**Request**: FormData with audio file
**Response**: 
```json
{
  "success": true,
  "text": "transcribed text"
}
```

## 📁 Project Structure

```
app/
├── components/          # Reusable components
│   └── VoiceInput.js   # Voice recording and transcription
├── dashboard/          # Dashboard pages
│   ├── page.js        # Forms list
│   └── create/        # Form builder
├── form/[id]/         # Public form filling
├── demo/              # Demo page
├── api/               # API routes
│   └── transcribe/    # Speech-to-text endpoint
├── layout.js          # Root layout
├── page.js            # Landing page
└── globals.css        # Global styles
```

## 🎨 Customization

### Styling
- Built with Tailwind CSS
- Modify `globals.css` for global styles
- Component-level styling in individual files

### Voice Recognition
- Configured for English by default
- Modify the `language` parameter in the transcription API
- Adjust temperature for more/less conservative transcription

### Storage
- Currently uses localStorage
- Easy to replace with database (PostgreSQL, MongoDB, etc.)
- Response format is JSON-ready

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add `OPENAI_API_KEY` environment variable
4. Deploy!

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Run `npm run build && npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter issues:
1. Check that your OpenAI API key is correctly set
2. Ensure microphone permissions are granted
3. Test in a supported browser (Chrome, Firefox, Safari)
4. Check the browser console for errors

## 🔮 Future Enhancements

- [ ] User authentication and accounts
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Form analytics and insights
- [ ] Multiple language support
- [ ] Custom themes and branding
- [ ] Export responses to CSV/Excel
- [ ] Webhook integrations
- [ ] Advanced field types (file upload, signatures)
- [ ] Form templates
- [ ] Conditional logic (show/hide fields)

---

Built with ❤️ using Next.js and OpenAI Whisper
