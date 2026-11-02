<script setup>
import InfoPage from '@/components/InfoPage.vue'
import { CONTACT_EMAIL } from '@/contact'
</script>

<template>
  <InfoPage title="Hjälp" intro="Allt du behöver veta för att spela WorldWarden.">
    <h3>Kom igång</h3>
    <p>
      Välj en nivå på startsidan och klicka på den för att starta ett quiz. Varje quiz har tio flaggor. Du kan spela
      nivån Nybörjare direkt som gäst, men då sparas inte ditt resultat. Skapa ett konto eller logga in med GitHub för
      att spara resultat, samla XP och låsa upp fler nivåer.
    </p>

    <h3>Nivåerna</h3>
    <ul>
      <li><strong>Nybörjare:</strong> välj vilken världsdel flaggan tillhör, av två alternativ.</li>
      <li><strong>Medel:</strong> välj rätt land av fyra alternativ.</li>
      <li><strong>Avancerad:</strong> skriv landets namn själv.</li>
      <li><strong>Expert:</strong> skriv både landets namn och dess huvudstad.</li>
    </ul>
    <p>
      När du skriver svaret spelar stora och små bokstäver ingen roll, och du behöver inte skriva accenter som i
      "Bogotá". Å, ä och ö måste däremot vara rätt. Du kan hoppa över en fråga om du inte vet svaret.
    </p>

    <h3>XP och nivåer</h3>
    <p>Du får XP för varje rätt svar. Ju svårare nivå, desto mer XP:</p>
    <ul>
      <li>Nybörjare: 50 XP per rätt svar</li>
      <li>Medel: 100 XP per rätt svar</li>
      <li>Avancerad: 150 XP per rätt svar</li>
      <li>Expert: 200 XP per rätt svar</li>
    </ul>
    <p>
      Får du alla tio rätt får du 50 XP extra. När du samlar XP går du upp i nivå och låser upp nästa svårighetsgrad:
      Medel vid 500 XP, Avancerad vid 1 300 XP och Expert vid 3 000 XP.
    </p>

    <h3>Ledtrådar</h3>
    <p>
      På nivåerna Avancerad och Expert kan du som är inloggad visa en ledtråd: vilken världsdel landet ligger i. Ett rätt
      svar efter en ledtråd ger halva XP:n för den frågan.
    </p>

    <h3>Medaljer</h3>
    <p>Det finns 18 medaljer att låsa upp:</p>
    <ul>
      <li>Brons, silver och guld på varje nivå, för minst 6 rätt, minst 8 rätt och 10 av 10 rätt.</li>
      <li>Medaljer för att ha genomfört 10, 20, 30 och 50 quiz med minst hälften rätt.</li>
      <li><strong>WorldWarden:</strong> lås upp alla tolv nivåmedaljer.</li>
      <li><strong>Fyra perfekta:</strong> få 10 av 10 rätt minst en gång på alla fyra nivåerna.</li>
    </ul>
    <p>Du ser dina medaljer på din profil.</p>

    <h3>Topplistor</h3>
    <p>
      Topplistorna visar alla spelare som har spelat klart minst ett quiz. Det finns en lista för total XP och en för
      varje nivå. På nivålistorna räknas ditt bästa resultat, och vid lika många rätt vinner den snabbaste tiden.
      Där visas ditt visningsnamn och din avatar, aldrig din e-postadress.
    </p>

    <h3>Ditt konto</h3>
    <ul>
      <li>Visningsnamn och avatar ändrar du på din profil.</li>
      <li>E-postadress och lösenord ändrar du under Inställningar. När du byter lösenord loggas du ut på alla andra enheter.</li>
      <li>Loggar du in med GitHub har kontot inget lösenord, och du loggar alltid in via GitHub.</li>
      <li>Du kan radera ditt konto under Inställningar. Då tas alla dina resultat bort.</li>
      <li>Du förblir inloggad i 24 timmar, sedan behöver du logga in igen.</li>
    </ul>

    <h3>Glömt lösenordet?</h3>
    <p>
      Det går ännu inte att återställa lösenordet själv. Kontakta oss på
      <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a> så hjälper vi dig.
    </p>

    <h3>Behöver du mer hjälp?</h3>
    <p>
      Hittar du inte svaret här är du välkommen att mejla oss på
      <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
    </p>
  </InfoPage>
</template>
