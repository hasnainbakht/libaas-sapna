Follow these steps to get the project running on your local machine.

-----------------------------------------------------------
IF YOU DOWNLOADED THE ZIP FROM GITHUB:
-----------------------------------------------------------
1. Extract the "Libaas-Sapna-main.zip" file to a folder.
2. Open the extracted folder in VS Code or any Terminal.
3. Proceed with the steps below.

-----------------------------------------------------------
STEP 1: DATABASE SETUP (XAMPP / MySQL)
-----------------------------------------------------------
1. Start XAMPP and ensure MySQL is RUNNING.
2. Open phpMyAdmin (http://localhost/phpmyadmin).
3. Create a NEW database named: libaas_sapna_db
4. Import the "libaas_sapna_db.sql" file into this database.
   (Alternatively, the project uses db.sqlite3 by default for development).

-----------------------------------------------------------
STEP 2: BACKEND SETUP (Django)
-----------------------------------------------------------
1. Open a terminal (CMD or PowerShell).
2. Navigate to the backend folder:
   cd backend

3. Create a virtual environment:
   python -m venv venv

4. Activate the virtual environment:
   venv\Scripts\activate

5. Install required libraries:
   pip install -r requirements.txt

6. Start the Backend Server:
   python manage.py runserver

* The backend will be running at: http://127.0.0.1:8000/

-----------------------------------------------------------
STEP 3: FRONTEND SETUP (React)
-----------------------------------------------------------
1. Open a NEW terminal window (keep the backend one running).
2. Navigate to the frontend folder:
   cd frontend

3. Install Node.js dependencies:
   npm install

4. Start the Frontend Server:
   npm start

* The website will open at: http://localhost:3000/

-----------------------------------------------------------
IMPORTANT NOTES:
-----------------------------------------------------------
- DATABASE: The project uses a pre-configured db.sqlite3 file in the backend folder.
- MEDIA: All product images are stored in backend/media/.
- WHATSAPP: To receive WhatsApp notifications, ensure the META_ACCESS_TOKEN in backend/.env is valid and the recipient number is verified in your Meta Developer portal.
- API KEYS: If you use the search functionality, ensure you add your OpenRouter API key in backend/modelcontext.txt.


