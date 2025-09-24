# 🚀 Guide de Déploiement - Pilotage Micro v1.0.0-beta

## 📋 **Vue d'ensemble**

Guide complet pour déployer l'application Pilotage Micro en production pour les tests avec un panel de 10-20 micro-entrepreneurs.

---

## 🔧 **Déploiement Backend (FastAPI + MongoDB)**

### **Option A : Railway (Recommandé)**

1. **Préparer le code backend**
   ```bash
   # Créer un Procfile
   echo "web: uvicorn server:app --host 0.0.0.0 --port \$PORT" > backend/Procfile
   
   # Créer runtime.txt
   echo "python-3.11" > backend/runtime.txt
   ```

2. **Déploiement sur Railway**
   - Se connecter sur [railway.app](https://railway.app)
   - Créer nouveau projet "pilotage-micro-backend"
   - Connecter le repository GitHub
   - Configurer variables d'environnement :
     ```
     MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/pilotage_micro?retryWrites=true&w=majority
     JWT_SECRET=your-super-secret-jwt-key-here-2025
     PYTHONPATH=/app/backend
     ```

3. **MongoDB Atlas (Base de données)**
   - Créer compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Créer cluster gratuit (M0)
   - Configurer utilisateur et récupérer connection string
   - Autoriser toutes les IPs (0.0.0.0/0) pour tests

### **Option B : Heroku**

1. **Installation Heroku CLI**
   ```bash
   # Installation
   curl https://cli-assets.heroku.com/install.sh | sh
   
   # Login
   heroku login
   ```

2. **Déploiement**
   ```bash
   # Dans le dossier backend
   cd backend
   heroku create pilotage-micro-api
   
   # Variables d'environnement
   heroku config:set MONGO_URL="mongodb+srv://..."
   heroku config:set JWT_SECRET="your-jwt-secret"
   
   # Deploy
   git push heroku main
   ```

### **Variables d'Environnement Requises**
```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/pilotage_micro
JWT_SECRET=pilotage-micro-secret-production-2025-xyz
PORT=8001
DB_NAME=pilotage_micro_prod
```

---

## 📱 **Déploiement Frontend Mobile (Expo)**

### **1. Configuration pour Production**

**Mettre à jour app.json :**
```json
{
  "expo": {
    "name": "Pilotage Micro",
    "slug": "pilotage-micro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.pilotagemicro.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.pilotagemicro.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

**Mettre à jour .env :**
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

### **2. Build APK Android**

```bash
# Installation EAS CLI
npm install -g @expo/eas-cli

# Login EAS
eas login

# Configuration EAS
eas build:configure

# Build APK pour tests
eas build --platform android --profile preview

# Télécharger l'APK généré
```

### **3. Build iOS (TestFlight)**

```bash
# Build iOS pour TestFlight
eas build --platform ios --profile preview

# Submit à TestFlight
eas submit --platform ios
```

### **4. Déploiement Web (Optionnel)**

**Via Vercel :**
```bash
# Installation Vercel CLI
npm install -g vercel

# Dans le dossier frontend
cd frontend
vercel --prod
```

**Via Netlify :**
```bash
# Build pour web
expo export:web

# Upload du dossier dist/ sur Netlify
```

---

## 🔗 **URLs de Production**

### **URLs Exemples**
- **Backend API :** `https://pilotage-micro-backend.railway.app`
- **App Web :** `https://pilotage-micro.vercel.app`
- **APK Android :** `https://expo.dev/artifacts/your-build-id`
- **TestFlight iOS :** `https://testflight.apple.com/join/your-code`

### **Endpoints API Principaux**
```
GET  /api/auth/me          - Vérifier authentification
POST /api/auth/register    - Inscription
POST /api/auth/login       - Connexion
GET  /api/dashboard        - Dashboard données
POST /api/invoices         - Créer facture
GET  /api/profile          - Profil utilisateur
```

---

## 📋 **Checklist Déploiement**

### **Backend**
- [ ] MongoDB Atlas configuré et accessible
- [ ] Variables d'environnement définies
- [ ] API déployée et accessible via URL
- [ ] Test endpoints avec Postman/curl
- [ ] Logs serveur fonctionnels
- [ ] CORS configuré pour frontend

### **Frontend**
- [ ] .env mis à jour avec URL backend production
- [ ] app.json configuré pour builds
- [ ] APK Android généré et testé
- [ ] Build iOS soumis à TestFlight
- [ ] Version web déployée (optionnel)
- [ ] QR codes générés pour Expo Go

### **Tests Production**
- [ ] Inscription/connexion fonctionnelle
- [ ] Onboarding complet testable
- [ ] Navigation entre onglets
- [ ] Création de factures
- [ ] Persistance des données
- [ ] Feedback bouton opérationnel

---

## 👥 **Distribution aux Testeurs**

### **Android**
1. **APK Direct**
   - Envoyer fichier APK par email/Drive
   - Instruction : Autoriser "Sources inconnues" dans paramètres
   
2. **Expo Go (Développement)**
   - Publier sur Expo : `expo publish`
   - Partager QR code ou lien `exp://exp.host/@username/pilotage-micro`

### **iOS**
1. **TestFlight (Recommandé)**
   - Inviter testeurs via email
   - Max 100 testeurs externes
   - Processus d'approbation Apple (~24h)

2. **Expo Go**
   - Même QR code que Android
   - Pas de signature requis

### **Web (Backup)**
- URL directe vers version web
- Compatible mobiles et desktop
- Pas d'installation requise

---

## 🔧 **Configuration Testeurs**

### **Email Template Invitation**
```
Objet : Invitation Test Pilotage Micro - Version Bêta

Bonjour [Prénom],

Merci d'avoir accepté de tester Pilotage Micro !

📱 INSTALLATION :

Android :
- Téléchargez l'APK : [LIEN]
- Autorisez l'installation depuis "Sources inconnues"

iOS :
- Rejoignez TestFlight : [LIEN]
- Suivez les instructions d'installation

Web (backup) :
- Accès direct : [URL]

🧪 TEST :
1. Créez votre compte avec vos vraies infos
2. Complétez l'onboarding fiscal (4 étapes)
3. Explorez le dashboard et créez quelques factures
4. Testez pendant 1 semaine minimum

📝 FEEDBACK :
Formulaire obligatoire : [LIEN_FEEDBACK]

❓ SUPPORT :
Contact : pilotage.micro.support@gmail.com

Merci pour votre aide !
```

### **Comptes de Test Prêts**
```
# Testeur 1 - BNC Consultant
Email: testeur1@pilotage-micro.fr
Password: TestPilotage2025!

# Testeur 2 - BIC E-commerce  
Email: testeur2@pilotage-micro.fr
Password: TestPilotage2025!

# Testeur 3 - BNC Formation
Email: testeur3@pilotage-micro.fr
Password: TestPilotage2025!
```

---

## 📊 **Monitoring & Analytics**

### **Logs Backend**
- Railway/Heroku logs en temps réel
- Monitoring erreurs API
- Compteur utilisateurs inscrits

### **Analytics Frontend**
- Expo Analytics (usage app)
- Posthog/Mixpanel (événements utilisateur)
- Crash reporting automatique

### **Métriques Critiques**
- Taux completion onboarding
- Retention J+3, J+7
- Nombre de factures créées
- Erreurs fréquentes

---

## 🚨 **Gestion des Incidents**

### **Procédure d'Urgence**
1. **Backend down** : Vérifier Railway/Heroku status
2. **App crash** : Consulter Expo error logs
3. **DB issues** : MongoDB Atlas monitoring
4. **Feedback testeurs** : Response < 2h pendant tests

### **Contacts Support**
- **Technique :** dev@pilotage-micro.fr
- **Feedback :** feedback@pilotage-micro.fr  
- **Urgent :** +33 X XX XX XX XX

---

**🎯 Objectif : App stable et testable par 20 micro-entrepreneurs en 48h !**