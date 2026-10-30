<script setup>
import InfoPage from '@/components/InfoPage.vue'
import { CONTACT_EMAIL } from '@/contact'
</script>

<template>
  <InfoPage
    title="Användarvillkor"
    intro="Det här gäller när du använder WorldWarden."
    updated="30 oktober 2026"
  >
    <h3>Om tjänsten</h3>
    <p>
      WorldWarden är ett gratis geografiquiz som har tagits fram som ett skolprojekt av Sandra, Kristina, Oskar och
      Adam. Genom att använda appen godkänner du de här villkoren.
    </p>

    <h3>Ditt konto</h3>
    <ul>
      <li>Du behöver inget konto för att spela nivån Nybörjare. För att spara resultat och låsa upp fler nivåer behöver du ett konto.</li>
      <li>Du ansvarar för ditt konto och ska hålla ditt lösenord hemligt.</li>
      <li>Du får bara ha ett konto som är ditt eget, och e-postadressen du anger ska vara din.</li>
      <li>Är du under 13 år behöver du en vårdnadshavares godkännande för att skapa ett konto.</li>
    </ul>

    <h3>Visningsnamn och avatar</h3>
    <p>
      Ditt visningsnamn syns för alla på topplistorna. Det får inte vara stötande, kränkande eller utge sig för att vara
      någon annan. Vi kan ändra eller ta bort visningsnamn som bryter mot det här.
    </p>

    <h3>Spela schyst</h3>
    <p>Topplistorna ska vara rättvisa för alla. Därför får du inte:</p>
    <ul>
      <li>fuska, till exempel genom att ändra i appen eller skicka egna anrop till servern,</li>
      <li>försöka komma åt någon annans konto,</li>
      <li>överbelasta eller försöka skada tjänsten.</li>
    </ul>
    <p>Bryter du mot reglerna kan vi ta bort dina resultat eller ditt konto.</p>

    <h3>Tjänstens tillgänglighet</h3>
    <p>
      WorldWarden är ett skolprojekt och tillhandahålls i befintligt skick. Vi gör vårt bästa för att appen ska fungera,
      men vi kan inte garantera att den alltid är tillgänglig eller fri från fel. Appen kan ändras, och funktioner kan
      läggas till eller tas bort.
    </p>

    <h3>Avsluta ditt konto</h3>
    <p>
      Du kan när som helst radera ditt konto under Inställningar. Då tas ditt konto och alla dina resultat bort och kan
      inte återställas.
    </p>

    <h3>Personuppgifter</h3>
    <p>
      Hur vi hanterar dina uppgifter beskrivs i vår
      <RouterLink :to="{ name: 'privacy' }">integritetspolicy</RouterLink>.
    </p>

    <h3>Ändringar av villkoren</h3>
    <p>
      Vi kan uppdatera villkoren. Datumet högst upp visar när de senast ändrades. Fortsätter du använda appen efter en
      ändring gäller de nya villkoren.
    </p>

    <h3>Kontakt</h3>
    <p>
      Har du frågor om villkoren är du välkommen att kontakta oss på
      <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
    </p>
  </InfoPage>
</template>
