# InfoQuiz – Infografikų Testų Generatorius

Sveiki atvykę į **InfoQuiz**! Tai išmani programa, leidžianti automatiškai generuoti testus iš mokomųjų infografikų, naudojant „Google Gemini“ dirbtinį intelektą. 

## 📥 Kaip atsisiųsti programą (Windows)?

Jau paruoštą ir ištestuotą „Windows“ programos versiją galite atsisiųsti iš mūsų GitHub repozitorijos:
1. Atsisiųskite [InfoQuiz-Windows.zip](https://github.com/Loudl3ss/Test_generator/releases/latest/download/InfoQuiz-Windows.zip) (naujausia versija).
2. Atsisiuntę `.zip` failą, išskleiskite jį savo kompiuteryje (dešiniuoju pelės mygtuku paspauskite ant failo ir pasirinkite *Extract all...* arba *Išskleisti viską...*).
3. **SVARBU:** Atidarykite išskleistą aplanką, suraskite failą **`Paleisti.bat`** (gali būti pavadintas tiesiog `Paleisti`, jei jūsų kompiuteris slepia failų galūnes) ir dukart ant jo paspauskite. Šis failas automatiškai atidarys programą jūsų interneto naršyklėje!

---

## 🔑 1. Žingsnis: Kaip gauti „Gemini API“ raktą?

Kad programa galėtų analizuoti infografikus ir kurti testus, jai reikalingas nemokamas „Google Gemini API“ raktas.

1. Eikite į oficialų puslapį: [Google AI Studio](https://aistudio.google.com/).
2. Prisijunkite su savo įprasta „Google“ paskyra (pavyzdžiui, kuria naudojatės „Gmail“ ar „YouTube“).
3. Kairiajame meniu spustelėkite mygtuką **„Get API key“**.
4. Paspauskite mėlyną mygtuką **„Create API key in new project“** (sukurti API raktą naujame projekte).
5. Sugeneruotą raktą (ilgą raidžių ir skaičių seką) **nukopijuokite**. Saugokite jį ir niekam neatskleiskite!

---

## ⚙️ 2. Žingsnis: Kur įdėti API raktą programoje?

1. Atidarykite **InfoQuiz** programą (dukart paspaudę `Paleisti.bat`).
2. Viršutiniame dešiniajame kampe paspauskite mygtuką **„Nustatymai“** (šalia krumpliaračio ikonos).
3. Atsidariusiame lange rasite laukelį, pavadintą „API raktas“.
4. **Įklijuokite** anksčiau nukopijuotą „Gemini API“ raktą į šį laukelį.
5. Paspauskite išsaugoti. Raktas išsaugomas jūsų kompiuterio naršyklėje (atviru tekstu). Nenaudokite rakto, susieto su apmokestinama paskyra, nes bet kas, turintis prieigą prie šio kompiuterio, gali jį pamatyti.

---

## 📚 3. Žingsnis: Kaip atsisiųsti 5 kl. infografikus?

Kartu su programos leidimu esame paruošę infografikus 5 klasės mokiniams. Juos rasite ten pat, kur ir pačią programą:

**Kaip juos atsisiųsti ir naudoti:**
1. Vėl eikite į „GitHub“ repozitorijos **Releases** skiltį.
2. Ties skyreliu „Assets“ suraskite ir atsisiųskite šiuos failus į savo kompiuterį:
   - `Gamtos mokslai 5kl.zip`
   - `Istorija 5kl.zip`
   - `Matematika 5kl.zip`
3. Kompiuteryje (dažniausiai „Atsisiuntimai“ aplanke) dešiniuoju pelės mygtuku paspauskite ant kiekvieno atsiųsto `.zip` failo ir pasirinkite **„Išskleisti viską“** (*Extract all*). Viduje rasite paveikslėlių failus (infografikus).

> **Patarimas:** Bibliotekos skirtuke galite iš karto įtempti (drag & drop) visus išskleistus paveikslėlius vienu metu — programa pati atpažins temos kodą ir dalyką iš failo pavadinimo.

---

## 📝 4. Žingsnis: Kaip sugeneruoti testą?

Kai jau turite veikiančią programą su įvestu API raktu ir išskleistus infografikus, galite sukurti testą:

1. **Įkelkite infografiką:** „InfoQuiz“ programos pagrindiniame lange paspauskite paveikslėlio įkėlimo mygtuką ir pasirinkite vieną iš išskleistų infografikų iš savo kompiuterio.
2. **Generuoti testą:** Paspauskite testo generavimo mygtuką.
3. Palaukite kelias sekundes – programa nusiųs infografiką „Gemini“ dirbtiniam intelektui. Jis išanalizuos pateiktą medžiagą ir automatiškai paruoš klausimus su atsakymų variantais.
4. **Atlikite testą:** Sugeneruotą testą galėsite peržiūrėti ir išspręsti pačioje programoje!

*Sėkmingo mokymosi ir lengvo testų kūrimo!*


## ⚠️ Svarbi informacija
* **Reikalingas internetas:** Nors programa paleidžiama vietiniame kompiuteryje, kiekvienas testo generavimas naudoja interneto ryšį norint susisiekti su „Gemini API“.
* **API limitai:** Nemokama „Gemini API“ versija turi užklausų limitus. Jei visa klasė (pvz. 25 mokiniai) vienu metu generuos testus, galite pasiekti limitą ir gauti klaidos pranešimą.
* **Operacinė sistema:** Pateiktas `Paleisti.bat` failas skirtas „Windows“ operacinei sistemai. „macOS“ ir „Linux“ vartotojai gali paleisti programą naudodami Python tiesiogiai iš šaltinio kodo.
* **Duomenų išsaugojimas:** Biblioteka saugoma jūsų naršyklės „IndexedDB“ atmintyje (`localhost`). Išvalius naršyklės duomenis, biblioteka dings.
