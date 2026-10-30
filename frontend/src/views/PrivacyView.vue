<script setup>
import InfoPage from '@/components/InfoPage.vue'
import { CONTACT_EMAIL } from '@/contact'
</script>

<template>
  <InfoPage
    title="Integritetspolicy"
    intro="Så här hanterar vi dina personuppgifter i WorldWarden."
    updated="30 oktober 2026"
  >
    <h3>Vem ansvarar för dina uppgifter?</h3>
    <p>
      WorldWarden är ett skolprojekt som drivs av Sandra, Kristina, Oskar och Adam. Vi ansvarar för de uppgifter som
      sparas i appen. Har du frågor om dina uppgifter kan du kontakta oss på
      <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
    </p>

    <h3>Spela som gäst</h3>
    <p>
      Spelar du utan konto sparar vi inga uppgifter om dig. Dina svar skickas till servern för att rättas, men
      resultatet sparas inte.
    </p>

    <h3>Vilka uppgifter sparar vi?</h3>
    <p>När du skapar ett konto och spelar sparar vi:</p>
    <ul>
      <li><strong>E-postadress:</strong> för att du ska kunna logga in.</li>
      <li>
        <strong>Lösenord:</strong> sparas aldrig i klartext, bara som en säker hash (argon2id). Ingen, inte ens vi, kan
        läsa ditt lösenord.
      </li>
      <li><strong>Visningsnamn och avatar:</strong> om du väljer att ange dem.</li>
      <li>
        <strong>Quizresultat:</strong> vilken nivå du spelade, vilka länder du fick, dina svar, om de var rätt, om du
        använde en ledtråd, när quizet startade och slutade, poäng och XP.
      </li>
      <li><strong>Datum</strong> för när kontot skapades och senast ändrades.</li>
    </ul>
    <p>
      Loggar du in med GitHub sparar vi ditt GitHub-id och den e-postadress som är verifierad på ditt GitHub-konto. Vi
      sparar inte din GitHub-token, den används bara en gång vid inloggningen.
    </p>

    <h3>Varför sparar vi uppgifterna?</h3>
    <ul>
      <li>För att du ska kunna logga in och hålla dig inloggad.</li>
      <li>För att räkna ut din XP, nivå, dina medaljer och personliga rekord.</li>
      <li>För att visa topplistorna.</li>
    </ul>
    <p>Vi använder aldrig dina uppgifter för reklam och vi säljer eller delar dem inte med någon annan.</p>

    <h3>Vad syns för andra?</h3>
    <p>
      Har du spelat klart minst ett quiz syns du på topplistorna med ditt visningsnamn, din avatar, ditt resultat och
      din tid. Andra spelare kan också se vilka medaljer du har låst upp. Har du inget visningsnamn visas du som
      "Spelare" följt av ett nummer. Din e-postadress visas aldrig för andra.
    </p>

    <h3>Cookies</h3>
    <p>WorldWarden använder bara cookies som behövs för att appen ska fungera:</p>
    <ul>
      <li>
        <strong>Inloggningscookie:</strong> håller dig inloggad i 24 timmar. Den kan inte läsas av JavaScript och tas
        bort när du loggar ut.
      </li>
      <li>
        <strong>GitHub-cookie:</strong> används i högst tio minuter under inloggning med GitHub, för att skydda
        inloggningen.
      </li>
    </ul>
    <p>Vi använder inga cookies för statistik eller reklam.</p>

    <h3>Tjänster från andra</h3>
    <ul>
      <li>
        <strong>Flaggbilderna</strong> hämtas från flagcdn.com. Då ser den tjänsten din IP-adress, precis som när du
        besöker vilken webbplats som helst.
      </li>
      <li><strong>GitHub</strong> används bara om du väljer att logga in med GitHub.</li>
    </ul>

    <h3>Hur länge sparas uppgifterna?</h3>
    <p>
      Dina uppgifter sparas så länge du har kvar ditt konto. Raderar du kontot tas alla dina uppgifter bort direkt: din
      profil, dina quizresultat och dina inloggningar.
    </p>

    <h3>Så skyddar vi dina uppgifter</h3>
    <ul>
      <li>Lösenord sparas bara som hash.</li>
      <li>Inloggningen sparas på servern som en hash, aldrig i klartext.</li>
      <li>Byter du lösenord loggas du ut på alla andra enheter.</li>
      <li>Antalet inloggningsförsök är begränsat, för att skydda mot den som försöker gissa lösenord.</li>
    </ul>

    <h3>Dina rättigheter</h3>
    <p>Enligt dataskyddsförordningen (GDPR) har du rätt att:</p>
    <ul>
      <li>få veta vilka uppgifter vi har om dig,</li>
      <li>rätta felaktiga uppgifter: visningsnamn och avatar ändrar du på din profil, e-post och lösenord under Inställningar,</li>
      <li>få dina uppgifter raderade: det gör du själv under Inställningar → Radera konto.</li>
    </ul>
    <p>
      Vill du veta vilka uppgifter vi har om dig, eller har du andra frågor, kontakta oss på
      <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>. Tycker du att vi hanterar dina uppgifter fel kan du
      klaga hos Integritetsskyddsmyndigheten (IMY).
    </p>

    <h3>Ändringar</h3>
    <p>
      Om appen ändras så att vi sparar nya uppgifter uppdaterar vi den här sidan. Datumet högst upp visar när den
      senast ändrades.
    </p>
  </InfoPage>
</template>
