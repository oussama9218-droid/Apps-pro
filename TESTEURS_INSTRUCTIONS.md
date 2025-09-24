# 📱 Instructions Testeurs - Pilotage Micro v1.0.0-beta

## 👋 **Bienvenue dans le Test Bêta !**

Merci d'avoir accepté de tester Pilotage Micro, l'application qui simplifie la gestion fiscale des micro-entrepreneurs français.

---

## 📲 **Installation de l'Application**

### **🤖 Android**

**Option 1 : APK Direct (Recommandé)**
1. Téléchargez le fichier APK : [LIEN_APK]
2. Sur votre téléphone : `Paramètres > Sécurité > Sources inconnues` → Activez
3. Ouvrez le fichier APK téléchargé
4. Suivez les instructions d'installation
5. L'icône "Pilotage Micro" apparaît sur votre écran d'accueil

**Option 2 : Expo Go**
1. Installez "Expo Go" depuis Google Play Store
2. Scannez ce QR code : [QR_CODE]
3. L'app s'ouvre directement dans Expo Go

### **🍎 iOS**

**Option 1 : TestFlight**
1. Installez "TestFlight" depuis l'App Store
2. Cliquez sur ce lien d'invitation : [TESTFLIGHT_LINK]
3. Acceptez l'invitation et installez Pilotage Micro
4. L'app apparaît sur votre écran d'accueil

**Option 2 : Expo Go**  
1. Installez "Expo Go" depuis l'App Store
2. Scannez le même QR code qu'Android
3. L'app s'ouvre directement dans Expo Go

### **💻 Web (Backup)**
Si vous avez des problèmes d'installation mobile :
- Accès direct : [WEB_URL]
- Fonctionne sur mobile et ordinateur
- Même expérience que l'app mobile

---

## 🧪 **Scénarios de Test Prioritaires**

### **📋 Test 1 : Premier Parcours Complet (30 min)**

**Objectif :** Valider que vous arrivez à configurer votre profil et naviguer dans l'app

**Étapes :**
1. **Inscription** 
   - Utilisez votre vraie adresse email
   - Prénom/nom réels (pour personnalisation)
   - Mot de passe sécurisé

2. **Onboarding Fiscal (4 étapes)**
   - Type d'activité : Choisissez BIC ou BNC selon votre vraie activité
   - Périodicité URSSAF : Mensuel ou trimestriel (votre choix réel)
   - Régime TVA : Probablement "Franchise" si vous êtes micro-entrepreneur
   - Seuils : Laissez les valeurs par défaut, ajoutez votre CA N-1 si vous voulez

3. **Exploration Dashboard**
   - Vérifiez que les jauges de seuils s'affichent
   - Consultez vos prochaines obligations
   - Regardez les transactions de demo

4. **Navigation**
   - Testez les 3 onglets : Tableau de bord / Factures / Profil
   - Vérifiez que les informations s'affichent correctement

**✅ Succès si :** Vous arrivez au dashboard avec vos infos personnalisées

### **📄 Test 2 : Gestion des Factures (15 min)**

**Objectif :** Tester la création et gestion de factures

**Étapes :**
1. Aller sur l'onglet "Factures"
2. Créer 2-3 factures de test avec :
   - Clients fictifs ou réels (votre choix)
   - Montants variés (ex: 500€, 1500€, 2200€)
   - Descriptions réalistes de vos prestations
3. Changer le statut d'une facture (brouillon → envoyée → payée)
4. Vérifier que les montants se répercutent sur le dashboard

**✅ Succès si :** Les factures se créent et les statuts se mettent à jour

### **👤 Test 3 : Profil et Paramètres (10 min)**

**Objectif :** Vérifier l'affichage des informations et le feedback

**Étapes :**
1. Aller sur l'onglet "Profil"
2. Vérifier que vos infos fiscales sont correctes
3. **IMPORTANT** : Cliquez sur "Donner son feedback" et remplissez le formulaire
4. Tester la déconnexion/reconnexion

**✅ Succès si :** Toutes vos infos s'affichent et le feedback fonctionne

---

## 📝 **Ce qu'on veut que vous testiez**

### **✅ Fonctionnel**
- [ ] L'inscription/connexion fonctionne
- [ ] L'onboarding fiscal est compréhensible
- [ ] Les calculs de seuils semblent corrects
- [ ] La création de factures est intuitive
- [ ] La navigation entre onglets est fluide
- [ ] L'app se reconnecte après fermeture

### **💭 Ressenti Utilisateur**
- Est-ce que vous comprenez immédiatement à quoi sert l'app ?
- L'onboarding fiscal vous semble-t-il adapté aux micro-entrepreneurs ?
- Manque-t-il des informations importantes sur le dashboard ?
- La création de factures couvre-t-elle vos besoins de base ?
- Utiliseriez-vous cette app au quotidien ?

### **🐛 Bugs et Problèmes**
- Pages qui ne se chargent pas
- Erreurs lors de la saisie
- Données qui disparaissent
- App qui crash ou freeze
- Problèmes d'affichage mobile

---

## 🏆 **Scenarios Avancés (Optionnel)**

Si vous avez le temps et la motivation :

### **🔄 Test Utilisation Quotidienne**
- Utilisez l'app 3-5 fois sur 1 semaine
- Créez 1 facture par jour ouvrable
- Consultez le dashboard régulièrement
- Notez ce qui vous manque au quotidien

### **📱 Test Multi-Device**
- Testez sur mobile ET ordinateur (version web)
- Vérifiez que vos données se synchronisent
- Testez avec différentes tailles d'écran

### **💸 Test Scénarios Réels**
- Saisissez vos vrais montants de facturation
- Comparez avec vos calculs Excel/outil actuel
- Vérifiez si les seuils correspondent à votre situation

---

## 📬 **Comment Donner votre Feedback**

### **📝 Formulaire Principal (OBLIGATOIRE)**
**Lien :** [FEEDBACK_FORM_URL]

**Contient :**
- Notes par fonctionnalité (1-5 étoiles)
- Questions sur l'utilité et l'usage
- Améliorations prioritaires
- Bugs rencontrés

**⏱️ Temps :** 5-10 minutes max

### **💬 Feedback Rapide (Dans l'app)**
- Onglet Profil → "Donner son feedback"
- Pour des commentaires courts/bugs urgents

### **📧 Contact Direct**
- **Support technique :** pilotage.micro.support@gmail.com
- **Feedback détaillé :** pilotage.micro.feedback@gmail.com
- **Urgent/Bug critique :** Répondez directement à cet email

---

## ❓ **FAQ Testeurs**

### **🔐 "J'ai oublié mon mot de passe"**
Pas de reset password encore → Créez un nouveau compte avec un autre email

### **📱 "L'app crash au démarrage"**  
- Redémarrez votre téléphone
- Réinstallez l'app
- Contactez le support avec le modèle de votre téléphone

### **🌐 "Pas de connexion internet"**
L'app nécessite internet pour fonctionner. Version hors-ligne prévue plus tard.

### **💾 "Mes données ont disparu"**
Signaler immédiatement ! C'est un bug critique à corriger.

### **⚡ "L'app est lente"**
Normal pour une version bêta. Notez les écrans les plus lents dans votre feedback.

### **🆘 "Je ne comprends pas l'onboarding fiscal"**
C'est un feedback précieux ! Expliquez ce qui vous pose problème.

---

## 🎁 **Récompenses Testeurs**

En remerciement de votre aide :

- **🎯 Feedback complet :** Accès gratuit à vie à la version Pro (valeur 15€/mois)
- **🏆 Bug critique trouvé :** Mention spéciale + goodies Pilotage Micro
- **💡 Suggestion implémentée :** Co-créateur officiel de la fonctionnalité

---

## 📅 **Timeline Test**

- **Semaine 1-2 :** Tests et exploration libre
- **Fin Semaine 2 :** Feedback obligatoire via formulaire
- **Semaine 3 :** Retours sur améliorations si nécessaire
- **Fin Janvier :** Version finale basée sur vos retours

---

## 🚀 **Vous êtes les Pionniers !**

Votre feedback va directement influencer :
- Les fonctionnalités Phase 2 (relances auto, sync bancaire, notifications)
- L'ergonomie et l'UX
- Le pricing et les formules d'abonnement
- La roadmap produit 2025

**Merci de contribuer à créer LA meilleure app pour les micro-entrepreneurs français ! 🇫🇷**

---

**🎯 Objectif : 15 minutes par jour pendant 1 semaine = impact énorme sur le produit final !**