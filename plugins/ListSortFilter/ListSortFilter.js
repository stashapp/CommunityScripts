/* =========================================================================
 * List Sort Filter (Stash UI plugin)
 *
 * Trims the "sort by" dropdown of any Stash list down to the options you
 * actually use. Untick an entry and it stops appearing in that list's menu.
 *
 *  - Display only. Sorting itself is never disabled: saved filters, default
 *    sorts and ?sortby=... URLs keep working even when the matching entry is
 *    hidden, and the dropdown button still names the current sort.
 *  - No list of sort options is kept in this plugin. Stash hands its list
 *    components the filter they render, so opening a list tells the plugin
 *    which sort options that list currently has, straight from Stash. Their
 *    labels are not stored either: the settings page formats Stash's own
 *    message IDs through Stash's own react-intl. So when Stash adds, removes
 *    or renames a sort option -- or when you switch UI language -- this plugin
 *    needs no update.
 *  - Hiding is plain CSS. Stash renders every sort entry with a data-value
 *    attribute, so nothing about the menus is rewritten or patched.
 *  - Lists are keyed by the mode Stash itself uses (SCENES, PERFORMERS, ...).
 *    The CSS is anchored on a sort value that occurs in that list and in no
 *    other, computed from the lists seen so far, because a stylesheet cannot
 *    know which list a menu belongs to. Values that share a name across lists
 *    (rating, path, tag_count...) therefore never leak, and lists embedded in
 *    performer / studio / tag pages are covered without any route matching.
 *  - The settings are drawn by the plugin, by patching Stash's PluginSettings
 *    and building the panel from Stash's own SettingGroup / BooleanSetting:
 *    Stash's plugin settings are static YAML, so a fixed checkbox per sort
 *    option would be exactly the thing that needs maintaining.
 * ========================================================================= */
(function () {
  "use strict";

  var PLUGIN_ID = "ListSortFilter";
  var STYLE_ID = "list-sort-filter-style";

  // Stash's list components, which receive the list's filter as a prop. This is
  // the plugin's only hard-coded knowledge of Stash, and it is API surface
  // rather than data -- a list type Stash adds later simply is not covered
  // until its name is added here.
  var LIST_COMPONENTS = [
    "SceneList", "PerformerList", "GroupList", "TagList",
    "StudioList", "GalleryList", "ImageList", "SceneMarkerList",
  ];

  /* ---------- strings ----------
   * Only the plugin's own wording lives here. Sort entries are labelled with
   * Stash's own translations (via its message IDs) and lists with Stash's own
   * name for them, so none of that needs translating.
   *
   * One entry per language Stash offers, keyed by lower-cased base code
   * ("de" covers de-DE, "pt" covers pt-BR); Chinese is split because Stash
   * ships both scripts. Anything missing falls back to English, so a partial
   * table is fine. Non-English strings are best-effort -- corrections from
   * native speakers are welcome. {n} is the number of entries in a list,
   * {hidden} how many of them are hidden. */
  var DEFAULT_LANG = "en";
  var STRINGS = {
    "en": {pluginDescription: "Trims each list's \"sort by\" dropdown to the options you actually use: untick an entry and it stops appearing in that list's menu. Display only -- sorting itself keeps working, so saved filters and ?sortby= URLs are unaffected. A list appears here once you have opened it.", pluginEnabled: "Enable this plugin", pluginEnabledDesc: "Turn off to show every sort option again, in every list. Default on.", sectionAll: "Ticked entries appear in this list's sort menu. All {n} shown.", sectionSome: "Ticked entries appear in this list's sort menu. {hidden} of {n} hidden.", empty: "No lists discovered yet. Open a list once and it will appear here."},
    "ja": {pluginDescription: "各一覧の「並び替え」ドロップダウンを、実際に使う項目だけに絞ります。チェックを外した項目はその一覧のメニューに出なくなります。隠すのは表示だけなのでソート機能そのものは動き続け、保存フィルタや ?sortby= 付きURLには影響しません。一覧は一度開くとここに現れます。", pluginEnabled: "このプラグインを有効にする", pluginEnabledDesc: "OFFにすると全ての一覧で絞り込みをやめ、全項目を表示します。既定はON。", sectionAll: "チェックした項目が並び替えメニューに出ます。{n}個すべて表示中。", sectionSome: "チェックした項目が並び替えメニューに出ます。{n}個中 {hidden}個を非表示。", empty: "まだ一覧を検出していません。一覧を一度開くと、ここに現れます。"},
    "af": {pluginDescription: "Sny elke lys se \"sorteer volgens\"-keuselys af tot die opsies wat jy werklik gebruik: merk 'n inskrywing af en dit verskyn nie meer in daardie lys se keuselys nie. Slegs vertoning -- sortering self werk steeds, dus word gestoorde filters en ?sortby=-URL's nie geraak nie. 'n Lys verskyn hier sodra jy dit oopgemaak het.", pluginEnabled: "Aktiveer hierdie inprop", pluginEnabledDesc: "Skakel af om weer elke sorteeropsie in elke lys te wys. Verstek aan.", sectionAll: "Gemerkte inskrywings verskyn in hierdie lys se sorteerkeuselys. Al {n} word gewys.", sectionSome: "Gemerkte inskrywings verskyn in hierdie lys se sorteerkeuselys. {hidden} van {n} versteek.", empty: "Nog geen lyste ontdek nie. Maak 'n lys een keer oop en dit sal hier verskyn."},
    "bg": {pluginDescription: "Съкращава менюто „сортиране по“ на всеки списък до опциите, които наистина използвате: махнете отметката и записът спира да се показва в менюто на този списък. Само визуално -- самото сортиране продължава да работи, така че запазените филтри и адресите с ?sortby= не са засегнати. Списъкът се появява тук, след като го отворите веднъж.", pluginEnabled: "Включване на приставката", pluginEnabledDesc: "Изключете, за да се покажат отново всички опции за сортиране във всички списъци. По подразбиране е включено.", sectionAll: "Отметнатите записи се показват в менюто за сортиране на този списък. Показани са всички {n}.", sectionSome: "Отметнатите записи се показват в менюто за сортиране на този списък. {hidden} от {n} са скрити.", empty: "Все още няма открити списъци. Отворете списък веднъж и той ще се появи тук."},
    "bn": {pluginDescription: "প্রতিটি তালিকার \"সাজানোর ভিত্তি\" মেনুকে আপনি যেগুলো আসলে ব্যবহার করেন সেগুলোতেই সীমিত করে: টিক তুলে দিলে সেই এন্ট্রি ওই তালিকার মেনুতে আর দেখা যায় না। শুধু প্রদর্শন -- সাজানো নিজে কাজ করতেই থাকে, তাই সংরক্ষিত ফিল্টার ও ?sortby= ইউআরএল অক্ষত থাকে। একবার তালিকাটি খুললেই সেটি এখানে আসবে।", pluginEnabled: "এই প্লাগইন সক্রিয় করুন", pluginEnabledDesc: "বন্ধ করলে সব তালিকায় আবার সব সাজানোর অপশন দেখা যাবে। ডিফল্ট চালু।", sectionAll: "টিক দেওয়া এন্ট্রিগুলো এই তালিকার সাজানোর মেনুতে দেখা যায়। সব {n}টি দেখানো হচ্ছে।", sectionSome: "টিক দেওয়া এন্ট্রিগুলো এই তালিকার সাজানোর মেনুতে দেখা যায়। {n}টির মধ্যে {hidden}টি লুকানো।", empty: "এখনও কোনো তালিকা শনাক্ত হয়নি। একটি তালিকা একবার খুললেই সেটি এখানে আসবে।"},
    "ca": {pluginDescription: "Redueix el desplegable \"ordena per\" de cada llista a les opcions que realment fas servir: desmarca una entrada i deixarà d'aparèixer al menú d'aquella llista. Només visual -- l'ordenació segueix funcionant, així que els filtres desats i els URL amb ?sortby= no es veuen afectats. Una llista apareix aquí quan l'has obert un cop.", pluginEnabled: "Activa aquest connector", pluginEnabledDesc: "Desactiva-ho per tornar a mostrar totes les opcions d'ordenació a totes les llistes. Activat per defecte.", sectionAll: "Les entrades marcades apareixen al menú d'ordenació d'aquesta llista. Es mostren totes {n}.", sectionSome: "Les entrades marcades apareixen al menú d'ordenació d'aquesta llista. {hidden} de {n} amagades.", empty: "Encara no s'ha detectat cap llista. Obre una llista un cop i apareixerà aquí."},
    "cs": {pluginDescription: "Zkrátí nabídku „seřadit podle“ každého seznamu na možnosti, které opravdu používáte: odškrtněte položku a přestane se v nabídce daného seznamu objevovat. Pouze zobrazení -- samotné řazení funguje dál, takže uložené filtry ani adresy s ?sortby= to neovlivní. Seznam se zde objeví, jakmile jej jednou otevřete.", pluginEnabled: "Zapnout tento plugin", pluginEnabledDesc: "Vypnutím se ve všech seznamech znovu zobrazí všechny možnosti řazení. Výchozí je zapnuto.", sectionAll: "Zaškrtnuté položky se objevují v nabídce řazení tohoto seznamu. Zobrazeno všech {n}.", sectionSome: "Zaškrtnuté položky se objevují v nabídce řazení tohoto seznamu. Skryto {hidden} z {n}.", empty: "Zatím nebyl nalezen žádný seznam. Otevřete některý seznam a objeví se zde."},
    "da": {pluginDescription: "Skærer hver listes \"sortér efter\"-menu ned til de valg, du faktisk bruger: fjern fluebenet, og punktet vises ikke længere i den listes menu. Kun visning -- selve sorteringen virker stadig, så gemte filtre og ?sortby=-adresser påvirkes ikke. En liste dukker op her, når du har åbnet den én gang.", pluginEnabled: "Aktivér dette plugin", pluginEnabledDesc: "Slå fra for at vise alle sorteringsvalg igen i alle lister. Slået til som standard.", sectionAll: "Afkrydsede punkter vises i denne listes sorteringsmenu. Alle {n} vises.", sectionSome: "Afkrydsede punkter vises i denne listes sorteringsmenu. {hidden} af {n} skjult.", empty: "Ingen lister fundet endnu. Åbn en liste én gang, så dukker den op her."},
    "de": {pluginDescription: "Kürzt das \"Sortieren nach\"-Menü jeder Liste auf die Optionen, die du wirklich benutzt: Haken entfernen und der Eintrag taucht im Menü dieser Liste nicht mehr auf. Nur die Anzeige -- das Sortieren selbst funktioniert weiter, gespeicherte Filter und ?sortby=-URLs bleiben unberührt. Eine Liste erscheint hier, sobald du sie einmal geöffnet hast.", pluginEnabled: "Dieses Plugin aktivieren", pluginEnabledDesc: "Ausschalten, um in allen Listen wieder alle Sortieroptionen anzuzeigen. Standard: an.", sectionAll: "Angehakte Einträge erscheinen im Sortiermenü dieser Liste. Alle {n} sichtbar.", sectionSome: "Angehakte Einträge erscheinen im Sortiermenü dieser Liste. {hidden} von {n} ausgeblendet.", empty: "Noch keine Listen erkannt. Öffne eine Liste einmal, dann erscheint sie hier."},
    "et": {pluginDescription: "Kärbib iga loendi „sorteeri“ menüü nendeks valikuteks, mida tegelikult kasutad: eemalda linnuke ja kirje kaob selle loendi menüüst. Ainult kuvamine -- sorteerimine ise töötab edasi, seega salvestatud filtrid ja ?sortby= aadressid ei muutu. Loend ilmub siia, kui oled selle korra avanud.", pluginEnabled: "Luba see plugin", pluginEnabledDesc: "Lülita välja, et kõik sorteerimisvalikud kõigis loendites uuesti näidata. Vaikimisi sees.", sectionAll: "Linnukesega kirjed ilmuvad selle loendi sorteerimismenüüsse. Kõik {n} on nähtaval.", sectionSome: "Linnukesega kirjed ilmuvad selle loendi sorteerimismenüüsse. Peidetud {hidden}/{n}.", empty: "Ühtegi loendit pole veel leitud. Ava mõni loend korra ja see ilmub siia."},
    "fa": {pluginDescription: "فهرست «مرتب‌سازی بر اساس» هر سیاهه را به گزینه‌هایی که واقعاً استفاده می‌کنید کوتاه می‌کند: تیک یک مورد را بردارید تا دیگر در آن فهرست نمایش داده نشود. فقط نمایش -- خودِ مرتب‌سازی کار می‌کند، بنابراین فیلترهای ذخیره‌شده و نشانی‌های ?sortby= بی‌تأثیر می‌مانند. هر سیاهه پس از یک‌بار باز کردن اینجا ظاهر می‌شود.", pluginEnabled: "فعال‌سازی این افزونه", pluginEnabledDesc: "خاموش کنید تا همهٔ گزینه‌های مرتب‌سازی در همهٔ سیاهه‌ها دوباره نمایش داده شوند. پیش‌فرض روشن.", sectionAll: "موارد تیک‌خورده در فهرست مرتب‌سازی این سیاهه دیده می‌شوند. هر {n} مورد نمایش داده می‌شود.", sectionSome: "موارد تیک‌خورده در فهرست مرتب‌سازی این سیاهه دیده می‌شوند. {hidden} از {n} پنهان است.", empty: "هنوز سیاهه‌ای شناسایی نشده است. یک سیاهه را یک‌بار باز کنید تا اینجا ظاهر شود."},
    "fi": {pluginDescription: "Karsii jokaisen luettelon \"lajittele\"-valikon niihin vaihtoehtoihin, joita todella käytät: poista rasti, niin kohta ei enää näy sen luettelon valikossa. Vain näkymä -- lajittelu itse toimii yhä, joten tallennetut suodattimet ja ?sortby=-osoitteet eivät muutu. Luettelo ilmestyy tänne, kun olet avannut sen kerran.", pluginEnabled: "Ota tämä liitännäinen käyttöön", pluginEnabledDesc: "Poista käytöstä, niin kaikki lajitteluvaihtoehdot näkyvät taas kaikissa luetteloissa. Oletuksena päällä.", sectionAll: "Rastitetut kohdat näkyvät tämän luettelon lajitteluvalikossa. Kaikki {n} näkyvissä.", sectionSome: "Rastitetut kohdat näkyvät tämän luettelon lajitteluvalikossa. {hidden}/{n} piilotettu.", empty: "Luetteloita ei ole vielä löytynyt. Avaa jokin luettelo kerran, niin se ilmestyy tänne."},
    "fr": {pluginDescription: "Réduit le menu « trier par » de chaque liste aux options que vous utilisez vraiment : décochez une entrée et elle disparaît du menu de cette liste. Affichage seulement -- le tri lui-même continue de fonctionner, donc les filtres enregistrés et les URL avec ?sortby= ne sont pas affectés. Une liste apparaît ici dès que vous l'avez ouverte une fois.", pluginEnabled: "Activer cette extension", pluginEnabledDesc: "Désactivez pour réafficher toutes les options de tri, dans toutes les listes. Activé par défaut.", sectionAll: "Les entrées cochées apparaissent dans le menu de tri de cette liste. Les {n} sont affichées.", sectionSome: "Les entrées cochées apparaissent dans le menu de tri de cette liste. {hidden} sur {n} masquées.", empty: "Aucune liste détectée pour l'instant. Ouvrez une liste une fois et elle apparaîtra ici."},
    "hi": {pluginDescription: "हर सूची के \"क्रमबद्ध करें\" मेनू को सिर्फ़ उन विकल्पों तक सीमित करता है जिन्हें आप वाकई इस्तेमाल करते हैं: टिक हटाइए और वह प्रविष्टि उस सूची के मेनू में दिखनी बंद हो जाएगी। केवल प्रदर्शन -- क्रमबद्ध करना खुद काम करता रहता है, इसलिए सहेजे गए फ़िल्टर और ?sortby= URL पर कोई असर नहीं पड़ता। सूची एक बार खोलते ही यहाँ आ जाती है।", pluginEnabled: "यह प्लगइन सक्षम करें", pluginEnabledDesc: "बंद करने पर हर सूची में सभी क्रमबद्ध विकल्प फिर दिखेंगे। डिफ़ॉल्ट रूप से चालू।", sectionAll: "टिक की गई प्रविष्टियाँ इस सूची के क्रम मेनू में दिखती हैं। सभी {n} दिख रही हैं।", sectionSome: "टिक की गई प्रविष्टियाँ इस सूची के क्रम मेनू में दिखती हैं। {n} में से {hidden} छिपी हैं।", empty: "अभी तक कोई सूची नहीं मिली। कोई सूची एक बार खोलें, वह यहाँ दिखने लगेगी।"},
    "hr": {pluginDescription: "Skraćuje izbornik „razvrstaj po“ svakog popisa na mogućnosti koje stvarno koristite: odznačite stavku i prestat će se pojavljivati u izborniku tog popisa. Samo prikaz -- samo razvrstavanje i dalje radi, pa spremljeni filtri i ?sortby= adrese ostaju netaknuti. Popis se ovdje pojavi čim ga jednom otvorite.", pluginEnabled: "Omogući ovaj dodatak", pluginEnabledDesc: "Isključite da se u svim popisima ponovno prikažu sve mogućnosti razvrstavanja. Zadano uključeno.", sectionAll: "Označene stavke pojavljuju se u izborniku razvrstavanja ovog popisa. Prikazano svih {n}.", sectionSome: "Označene stavke pojavljuju se u izborniku razvrstavanja ovog popisa. Skriveno {hidden} od {n}.", empty: "Još nije pronađen nijedan popis. Otvorite neki popis i pojavit će se ovdje."},
    "id": {pluginDescription: "Memangkas menu \"urutkan berdasarkan\" tiap daftar menjadi opsi yang benar-benar Anda pakai: hapus centang dan entri itu tidak lagi muncul di menu daftar tersebut. Hanya tampilan -- pengurutan sendiri tetap bekerja, jadi filter tersimpan dan URL ?sortby= tidak terpengaruh. Sebuah daftar muncul di sini setelah Anda membukanya sekali.", pluginEnabled: "Aktifkan plugin ini", pluginEnabledDesc: "Matikan untuk menampilkan kembali semua opsi pengurutan di semua daftar. Bawaan aktif.", sectionAll: "Entri yang dicentang muncul di menu urutan daftar ini. Semua {n} ditampilkan.", sectionSome: "Entri yang dicentang muncul di menu urutan daftar ini. {hidden} dari {n} disembunyikan.", empty: "Belum ada daftar yang terdeteksi. Buka sebuah daftar sekali dan ia akan muncul di sini."},
    "hu": {pluginDescription: "Minden lista „rendezés“ menüjét azokra a lehetőségekre szűkíti, amelyeket tényleg használsz: vedd ki a pipát, és a bejegyzés eltűnik az adott lista menüjéből. Csak megjelenítés -- maga a rendezés továbbra is működik, így a mentett szűrők és a ?sortby= címek érintetlenek. Egy lista akkor jelenik meg itt, ha egyszer megnyitottad.", pluginEnabled: "Bővítmény engedélyezése", pluginEnabledDesc: "Kikapcsolva minden listában újra látszik az összes rendezési lehetőség. Alapértelmezés: be.", sectionAll: "A kipipált bejegyzések megjelennek e lista rendezési menüjében. Mind a(z) {n} látszik.", sectionSome: "A kipipált bejegyzések megjelennek e lista rendezési menüjében. {n} közül {hidden} rejtve.", empty: "Még nem található lista. Nyiss meg egy listát, és itt megjelenik."},
    "it": {pluginDescription: "Riduce il menu \"ordina per\" di ogni elenco alle opzioni che usi davvero: togli la spunta e la voce smette di comparire nel menu di quell'elenco. Solo visualizzazione -- l'ordinamento continua a funzionare, quindi i filtri salvati e gli URL con ?sortby= non cambiano. Un elenco compare qui una volta che lo hai aperto.", pluginEnabled: "Abilita questo plugin", pluginEnabledDesc: "Disattiva per mostrare di nuovo tutte le opzioni di ordinamento, in ogni elenco. Attivo per impostazione predefinita.", sectionAll: "Le voci spuntate compaiono nel menu di ordinamento di questo elenco. Tutte le {n} mostrate.", sectionSome: "Le voci spuntate compaiono nel menu di ordinamento di questo elenco. {hidden} su {n} nascoste.", empty: "Nessun elenco rilevato finora. Apri un elenco una volta e comparirà qui."},
    "ko": {pluginDescription: "각 목록의 \"정렬 기준\" 드롭다운을 실제로 쓰는 항목만 남깁니다. 체크를 해제하면 그 항목은 해당 목록의 메뉴에 나타나지 않습니다. 표시만 바꿀 뿐이라 정렬 자체는 그대로 동작하며, 저장된 필터나 ?sortby= 주소에는 영향이 없습니다. 목록은 한 번 열면 여기에 나타납니다.", pluginEnabled: "이 플러그인 사용", pluginEnabledDesc: "끄면 모든 목록에서 모든 정렬 항목이 다시 표시됩니다. 기본값은 켜짐.", sectionAll: "체크한 항목이 이 목록의 정렬 메뉴에 표시됩니다. {n}개 모두 표시 중.", sectionSome: "체크한 항목이 이 목록의 정렬 메뉴에 표시됩니다. {n}개 중 {hidden}개 숨김.", empty: "아직 발견된 목록이 없습니다. 목록을 한 번 열면 여기에 나타납니다."},
    "lv": {pluginDescription: "Saīsina katra saraksta izvēlni „kārtot pēc“ līdz tām iespējām, kuras tiešām lietojat: noņemiet ķeksīti, un ieraksts vairs neparādās šī saraksta izvēlnē. Tikai attēlojums -- pati kārtošana turpina darboties, tāpēc saglabātie filtri un ?sortby= adreses netiek skartas. Saraksts parādās šeit, tiklīdz to reizi esat atvēris.", pluginEnabled: "Iespējot šo spraudni", pluginEnabledDesc: "Izslēdziet, lai visos sarakstos atkal rādītu visas kārtošanas iespējas. Noklusēti ieslēgts.", sectionAll: "Atzīmētie ieraksti parādās šī saraksta kārtošanas izvēlnē. Rādīti visi {n}.", sectionSome: "Atzīmētie ieraksti parādās šī saraksta kārtošanas izvēlnē. Paslēpti {hidden} no {n}.", empty: "Vēl nav atrasts neviens saraksts. Atveriet kādu sarakstu, un tas parādīsies šeit."},
    "lt": {pluginDescription: "Sutrumpina kiekvieno sąrašo „rikiuoti pagal“ meniu iki tų parinkčių, kurias iš tikrųjų naudojate: nuimkite varnelę ir įrašas nustos rodytis to sąrašo meniu. Tik rodymas -- pats rikiavimas veikia toliau, todėl išsaugoti filtrai ir ?sortby= adresai nenukenčia. Sąrašas čia atsiranda, kai jį kartą atidarote.", pluginEnabled: "Įjungti šį papildinį", pluginEnabledDesc: "Išjunkite, kad visuose sąrašuose vėl būtų rodomos visos rikiavimo parinktys. Numatyta įjungta.", sectionAll: "Pažymėti įrašai rodomi šio sąrašo rikiavimo meniu. Rodomi visi {n}.", sectionSome: "Pažymėti įrašai rodomi šio sąrašo rikiavimo meniu. Paslėpta {hidden} iš {n}.", empty: "Kol kas nerasta nė vieno sąrašo. Atidarykite sąrašą ir jis atsiras čia."},
    "nb": {pluginDescription: "Korter ned «sorter etter»-menyen i hver liste til valgene du faktisk bruker: fjern haken, så vises ikke oppføringen lenger i den listas meny. Kun visning -- selve sorteringen virker fortsatt, så lagrede filtre og ?sortby=-adresser påvirkes ikke. En liste dukker opp her når du har åpnet den én gang.", pluginEnabled: "Slå på denne utvidelsen", pluginEnabledDesc: "Slå av for å vise alle sorteringsvalg igjen, i alle lister. På som standard.", sectionAll: "Avkryssede oppføringer vises i denne listas sorteringsmeny. Alle {n} vises.", sectionSome: "Avkryssede oppføringer vises i denne listas sorteringsmeny. {hidden} av {n} skjult.", empty: "Ingen lister funnet ennå. Åpne en liste én gang, så dukker den opp her."},
    "nn": {pluginDescription: "Kortar ned «sorter etter»-menyen i kvar liste til dei vala du faktisk brukar: ta bort haken, så syner ikkje oppføringa seg lenger i menyen til den lista. Berre vising -- sjølve sorteringa verkar framleis, så lagra filter og ?sortby=-adresser vert ikkje påverka. Ei liste dukkar opp her når du har opna ho ein gong.", pluginEnabled: "Slå på denne utvidinga", pluginEnabledDesc: "Slå av for å syne alle sorteringsval att, i alle lister. På som standard.", sectionAll: "Avkryssa oppføringar syner seg i sorteringsmenyen til denne lista. Alle {n} vert viste.", sectionSome: "Avkryssa oppføringar syner seg i sorteringsmenyen til denne lista. {hidden} av {n} er gøymde.", empty: "Ingen lister funne enno. Opne ei liste ein gong, så dukkar ho opp her."},
    "nl": {pluginDescription: "Snoeit het \"sorteren op\"-menu van elke lijst terug tot de opties die je echt gebruikt: haal het vinkje weg en het item verschijnt niet meer in het menu van die lijst. Alleen weergave -- het sorteren zelf blijft werken, dus opgeslagen filters en ?sortby=-URL's blijven ongemoeid. Een lijst verschijnt hier zodra je hem één keer hebt geopend.", pluginEnabled: "Deze plug-in inschakelen", pluginEnabledDesc: "Uitzetten om in elke lijst weer alle sorteeropties te tonen. Standaard aan.", sectionAll: "Aangevinkte items verschijnen in het sorteermenu van deze lijst. Alle {n} zichtbaar.", sectionSome: "Aangevinkte items verschijnen in het sorteermenu van deze lijst. {hidden} van {n} verborgen.", empty: "Nog geen lijsten gevonden. Open een lijst één keer en hij verschijnt hier."},
    "pl": {pluginDescription: "Skraca menu „sortuj według“ każdej listy do opcji, których naprawdę używasz: odznacz pozycję, a przestanie pojawiać się w menu tej listy. Tylko wyświetlanie -- samo sortowanie nadal działa, więc zapisane filtry i adresy z ?sortby= pozostają nietknięte. Lista pojawia się tutaj, gdy raz ją otworzysz.", pluginEnabled: "Włącz tę wtyczkę", pluginEnabledDesc: "Wyłącz, aby we wszystkich listach znów pokazać wszystkie opcje sortowania. Domyślnie włączone.", sectionAll: "Zaznaczone pozycje pojawiają się w menu sortowania tej listy. Widocznych wszystkie {n}.", sectionSome: "Zaznaczone pozycje pojawiają się w menu sortowania tej listy. Ukryto {hidden} z {n}.", empty: "Nie wykryto jeszcze żadnej listy. Otwórz listę raz, a pojawi się tutaj."},
    "pt": {pluginDescription: "Reduz o menu \"ordenar por\" de cada lista às opções que você realmente usa: desmarque uma entrada e ela deixa de aparecer no menu daquela lista. Apenas exibição -- a ordenação em si continua funcionando, então filtros salvos e URLs com ?sortby= não são afetados. Uma lista aparece aqui assim que você a abre uma vez.", pluginEnabled: "Ativar este plugin", pluginEnabledDesc: "Desligue para mostrar novamente todas as opções de ordenação, em todas as listas. Ligado por padrão.", sectionAll: "As entradas marcadas aparecem no menu de ordenação desta lista. Todas as {n} exibidas.", sectionSome: "As entradas marcadas aparecem no menu de ordenação desta lista. {hidden} de {n} ocultas.", empty: "Nenhuma lista detectada ainda. Abra uma lista uma vez e ela aparecerá aqui."},
    "ro": {pluginDescription: "Reduce meniul „sortează după“ al fiecărei liste la opțiunile pe care chiar le folosești: debifează o intrare și nu va mai apărea în meniul acelei liste. Doar afișare -- sortarea în sine funcționează în continuare, deci filtrele salvate și adresele cu ?sortby= nu sunt afectate. O listă apare aici după ce o deschizi o dată.", pluginEnabled: "Activează acest plugin", pluginEnabledDesc: "Dezactivează pentru a afișa din nou toate opțiunile de sortare, în toate listele. Implicit pornit.", sectionAll: "Intrările bifate apar în meniul de sortare al acestei liste. Toate cele {n} sunt afișate.", sectionSome: "Intrările bifate apar în meniul de sortare al acestei liste. {hidden} din {n} ascunse.", empty: "Nicio listă detectată încă. Deschide o listă o dată și va apărea aici."},
    "ru": {pluginDescription: "Сокращает меню «сортировать по» каждого списка до тех пунктов, которыми вы действительно пользуетесь: снимите галочку, и пункт перестанет появляться в меню этого списка. Только отображение -- сама сортировка продолжает работать, поэтому сохранённые фильтры и адреса с ?sortby= не затрагиваются. Список появляется здесь, как только вы его один раз откроете.", pluginEnabled: "Включить это расширение", pluginEnabledDesc: "Выключите, чтобы во всех списках снова показывались все варианты сортировки. По умолчанию включено.", sectionAll: "Отмеченные пункты появляются в меню сортировки этого списка. Показаны все {n}.", sectionSome: "Отмеченные пункты появляются в меню сортировки этого списка. Скрыто {hidden} из {n}.", empty: "Списки пока не обнаружены. Откройте любой список — и он появится здесь."},
    "es": {pluginDescription: "Recorta el menú \"ordenar por\" de cada lista a las opciones que realmente usas: desmarca una entrada y dejará de aparecer en el menú de esa lista. Solo visualización -- la ordenación en sí sigue funcionando, así que los filtros guardados y las URL con ?sortby= no se ven afectados. Una lista aparece aquí en cuanto la has abierto una vez.", pluginEnabled: "Activar este complemento", pluginEnabledDesc: "Desactívalo para volver a mostrar todas las opciones de ordenación en todas las listas. Activado por defecto.", sectionAll: "Las entradas marcadas aparecen en el menú de ordenación de esta lista. Se muestran las {n}.", sectionSome: "Las entradas marcadas aparecen en el menú de ordenación de esta lista. {hidden} de {n} ocultas.", empty: "Aún no se ha detectado ninguna lista. Abre una lista una vez y aparecerá aquí."},
    "sk": {pluginDescription: "Skráti ponuku „zoradiť podľa“ každého zoznamu na možnosti, ktoré naozaj používate: odškrtnite položku a prestane sa v ponuke daného zoznamu zobrazovať. Iba zobrazenie -- samotné zoraďovanie funguje ďalej, takže uložené filtre ani adresy s ?sortby= to neovplyvní. Zoznam sa tu objaví, keď ho raz otvoríte.", pluginEnabled: "Zapnúť tento doplnok", pluginEnabledDesc: "Vypnutím sa vo všetkých zoznamoch znova zobrazia všetky možnosti zoraďovania. Predvolene zapnuté.", sectionAll: "Zaškrtnuté položky sa zobrazujú v ponuke zoraďovania tohto zoznamu. Zobrazených všetkých {n}.", sectionSome: "Zaškrtnuté položky sa zobrazujú v ponuke zoraďovania tohto zoznamu. Skrytých {hidden} z {n}.", empty: "Zatiaľ sa nenašiel žiadny zoznam. Otvorte niektorý zoznam a objaví sa tu."},
    "sv": {pluginDescription: "Kortar ner varje listas \"sortera efter\"-meny till de val du faktiskt använder: ta bort bocken så slutar posten synas i den listans meny. Endast visning -- sorteringen i sig fungerar fortfarande, så sparade filter och ?sortby=-adresser påverkas inte. En lista dyker upp här när du har öppnat den en gång.", pluginEnabled: "Aktivera det här tillägget", pluginEnabledDesc: "Stäng av för att visa alla sorteringsval igen, i alla listor. På som standard.", sectionAll: "Ikryssade poster syns i den här listans sorteringsmeny. Alla {n} visas.", sectionSome: "Ikryssade poster syns i den här listans sorteringsmeny. {hidden} av {n} dolda.", empty: "Inga listor hittade än. Öppna en lista en gång så dyker den upp här."},
    "tr": {pluginDescription: "Her listenin \"sırala\" menüsünü gerçekten kullandığınız seçeneklere indirir: işareti kaldırın, o girdi artık o listenin menüsünde görünmez. Yalnızca görünüm -- sıralamanın kendisi çalışmaya devam eder, bu yüzden kayıtlı filtreler ve ?sortby= adresleri etkilenmez. Bir listeyi bir kez açtığınızda burada belirir.", pluginEnabled: "Bu eklentiyi etkinleştir", pluginEnabledDesc: "Kapatınca tüm listelerde bütün sıralama seçenekleri yeniden görünür. Varsayılan açık.", sectionAll: "İşaretli girdiler bu listenin sıralama menüsünde görünür. {n} girdinin tamamı görünüyor.", sectionSome: "İşaretli girdiler bu listenin sıralama menüsünde görünür. {n} girdiden {hidden} tanesi gizli.", empty: "Henüz liste bulunamadı. Bir listeyi bir kez açın, burada görünecek."},
    "th": {pluginDescription: "ตัดเมนู \"เรียงตาม\" ของแต่ละรายการให้เหลือเฉพาะตัวเลือกที่คุณใช้จริง: เอาเครื่องหมายถูกออก แล้วรายการนั้นจะไม่ปรากฏในเมนูของรายการนั้นอีก เป็นเพียงการแสดงผล -- การเรียงลำดับยังทำงานตามปกติ ตัวกรองที่บันทึกไว้และ URL ที่มี ?sortby= จึงไม่ได้รับผลกระทบ รายการจะปรากฏที่นี่เมื่อคุณเปิดมันหนึ่งครั้ง", pluginEnabled: "เปิดใช้งานปลั๊กอินนี้", pluginEnabledDesc: "ปิดเพื่อแสดงตัวเลือกการเรียงทั้งหมดอีกครั้งในทุกรายการ ค่าเริ่มต้นคือเปิด", sectionAll: "รายการที่ติ๊กไว้จะปรากฏในเมนูเรียงลำดับของรายการนี้ แสดงครบทั้ง {n} รายการ", sectionSome: "รายการที่ติ๊กไว้จะปรากฏในเมนูเรียงลำดับของรายการนี้ ซ่อนอยู่ {hidden} จาก {n}", empty: "ยังไม่พบรายการใด เปิดรายการสักครั้งแล้วมันจะปรากฏที่นี่"},
    "uk": {pluginDescription: "Скорочує меню «сортувати за» кожного списку до тих пунктів, якими ви справді користуєтесь: зніміть галочку, і пункт більше не з'являтиметься в меню цього списку. Лише відображення -- саме сортування працює далі, тож збережені фільтри та адреси з ?sortby= не зачіпаються. Список з'являється тут, щойно ви його один раз відкриєте.", pluginEnabled: "Увімкнути це розширення", pluginEnabledDesc: "Вимкніть, щоб у всіх списках знову показувалися всі варіанти сортування. Типово увімкнено.", sectionAll: "Позначені пункти з'являються в меню сортування цього списку. Показано всі {n}.", sectionSome: "Позначені пункти з'являються в меню сортування цього списку. Приховано {hidden} з {n}.", empty: "Списків поки не виявлено. Відкрийте будь-який список — і він з'явиться тут."},
    "ur": {pluginDescription: "ہر فہرست کے \"ترتیب دیں\" مینو کو صرف اُن اختیارات تک محدود کرتا ہے جو آپ واقعی استعمال کرتے ہیں: نشان ہٹا دیں اور وہ اندراج اُس فہرست کے مینو میں دکھائی نہیں دے گا۔ صرف نمائش -- ترتیب دینا خود کام کرتا رہتا ہے، اس لیے محفوظ فلٹرز اور ?sortby= والے یو آر ایل متاثر نہیں ہوتے۔ فہرست ایک بار کھولنے پر یہاں آ جاتی ہے۔", pluginEnabled: "یہ پلگ ان فعال کریں", pluginEnabledDesc: "بند کرنے پر ہر فہرست میں تمام ترتیب کے اختیارات دوبارہ دکھائی دیں گے۔ بطور طے شدہ آن۔", sectionAll: "نشان زدہ اندراجات اس فہرست کے ترتیب مینو میں دکھائی دیتے ہیں۔ تمام {n} دکھائے جا رہے ہیں۔", sectionSome: "نشان زدہ اندراجات اس فہرست کے ترتیب مینو میں دکھائی دیتے ہیں۔ {n} میں سے {hidden} پوشیدہ۔", empty: "ابھی تک کوئی فہرست نہیں ملی۔ کوئی فہرست ایک بار کھولیں، وہ یہاں آ جائے گی۔"},
    "vi": {pluginDescription: "Rút gọn trình đơn \"sắp xếp theo\" của mỗi danh sách xuống những lựa chọn bạn thực sự dùng: bỏ đánh dấu một mục và nó sẽ không còn xuất hiện trong trình đơn của danh sách đó. Chỉ hiển thị -- việc sắp xếp vẫn hoạt động, nên các bộ lọc đã lưu và URL có ?sortby= không bị ảnh hưởng. Một danh sách sẽ xuất hiện ở đây sau khi bạn mở nó một lần.", pluginEnabled: "Bật phần mở rộng này", pluginEnabledDesc: "Tắt để hiển thị lại mọi lựa chọn sắp xếp trong mọi danh sách. Mặc định bật.", sectionAll: "Các mục được đánh dấu sẽ xuất hiện trong trình đơn sắp xếp của danh sách này. Hiển thị cả {n} mục.", sectionSome: "Các mục được đánh dấu sẽ xuất hiện trong trình đơn sắp xếp của danh sách này. Ẩn {hidden} trong {n}.", empty: "Chưa phát hiện danh sách nào. Mở một danh sách một lần và nó sẽ xuất hiện ở đây."},
    "zh-tw": {pluginDescription: "把每個清單的「排序方式」選單縮減成你真正會用的項目：取消勾選後，該項目就不再出現在那個清單的選單裡。只影響顯示 -- 排序本身照常運作，因此已儲存的篩選器和 ?sortby= 網址都不受影響。清單只要開啟過一次就會出現在這裡。", pluginEnabled: "啟用此外掛", pluginEnabledDesc: "關閉後，所有清單會再次顯示全部排序項目。預設為開啟。", sectionAll: "勾選的項目會出現在此清單的排序選單中。{n} 項全部顯示。", sectionSome: "勾選的項目會出現在此清單的排序選單中。{n} 項中隱藏了 {hidden} 項。", empty: "尚未偵測到任何清單。開啟任一清單一次，它就會出現在這裡。"},
    "zh-cn": {pluginDescription: "把每个列表的“排序方式”下拉菜单精简为你真正会用的项：取消勾选后，该项就不再出现在那个列表的菜单里。只影响显示 -- 排序本身照常工作，因此已保存的筛选器和 ?sortby= 网址都不受影响。列表只要打开过一次就会出现在这里。", pluginEnabled: "启用此插件", pluginEnabledDesc: "关闭后，所有列表会重新显示全部排序项。默认开启。", sectionAll: "勾选的项会出现在此列表的排序菜单中。{n} 项全部显示。", sectionSome: "勾选的项会出现在此列表的排序菜单中。{n} 项中隐藏了 {hidden} 项。", empty: "尚未检测到任何列表。打开任一列表一次，它就会出现在这里。"},
  };

  var lang = DEFAULT_LANG;
  function pickLang(code) {
    if (!code) return DEFAULT_LANG;
    var full = String(code).toLowerCase();
    if (STRINGS[full]) return full;
    var base = full.split("-")[0];
    return STRINGS[base] ? base : DEFAULT_LANG;
  }
  // Falls back per string, so a table that only covers some of them still works.
  function t(key) {
    var s = (STRINGS[lang] || {})[key];
    return s == null ? STRINGS[DEFAULT_LANG][key] : s;
  }
  function sectionText(total, hidden) {
    return t(hidden ? "sectionSome" : "sectionAll")
      .split("{n}").join(total)
      .split("{hidden}").join(hidden);
  }

  function asBool(v) {
    if (v === true || v === false) return v;
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  }
  function parse(json, fallback) {
    try { var v = JSON.parse(json); return v && typeof v === "object" ? v : fallback; }
    catch (e) { return fallback; }
  }

  /* ---------- state ---------- */

  var state = {
    enabled: true,
    // mode -> { values: [...], messages: {value: messageID} }
    lists: {},
    // mode -> [values that are hidden]
    hidden: {},
  };

  function gql(query, variables) {
    return fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ query: query, variables: variables || {} }),
    }).then(function (r) { return r.json(); });
  }

  function readConfig() {
    return gql("{configuration{plugins interface{language}}}")
      .then(function (j) {
        var c = j.data.configuration;
        return {
          settings: (c.plugins || {})[PLUGIN_ID] || {},
          language: c.interface ? c.interface.language : null,
        };
      })
      .catch(function () { return null; });
  }

  // configurePlugin REPLACES the whole settings map, so always send all of it.
  function writeConfig() {
    return gql(
      "mutation($id:ID!,$in:Map!){configurePlugin(plugin_id:$id,input:$in)}",
      { id: PLUGIN_ID, in: {
        enabled: state.enabled,
        lists: JSON.stringify(state.lists),
        hidden: JSON.stringify(state.hidden),
      } }
    ).catch(function () {});
  }

  /* ---------- what each list offers ----------
   * Recorded from the filter Stash passes its list components, so it is always
   * what this Stash build actually offers, in this list, right now. */

  function record(filter) {
    if (!filter || !filter.mode || !filter.options) return;
    var options = filter.options.sortByOptions;
    if (!options || !options.length) return;

    var values = [];
    var messages = {};
    options.forEach(function (o) {
      if (!o || !o.value) return;
      values.push(o.value);
      messages[o.value] = o.messageID || o.value;
    });
    if (!values.length) return;

    var prev = state.lists[filter.mode];
    var next = { values: values, messages: messages };
    if (JSON.stringify(prev) === JSON.stringify(next)) return;

    state.lists[filter.mode] = next;
    // An option Stash dropped should not stay hidden if it ever comes back.
    var hide = (state.hidden[filter.mode] || []).filter(function (v) {
      return values.indexOf(v) !== -1;
    });
    if (hide.length) state.hidden[filter.mode] = hide;
    else delete state.hidden[filter.mode];

    // This runs inside another component's render; do the rest after it.
    setTimeout(function () {
      if (!loaded) return; // config not in yet: it would be written back empty
      writeConfig();
      applyCss();
      notifySettings();
    }, 0);
  }

  /* ---------- hiding ----------
   * A menu is targeted by a value that occurs in it and in no other known
   * menu. Where the known menus give no such value (one list's options being
   * a subset of another's), the selector additionally excludes the values only
   * the other list has. */

  var HAS_SUPPORT = (function () {
    try { return CSS.supports("selector(:has(*))"); } catch (e) { return false; }
  })();

  function has(value) { return ':has(.dropdown-item[data-value="' + value + '"])'; }

  function menuSelector(mode) {
    var base = ".sort-by-select .dropdown-menu";
    var mine = (state.lists[mode] || {}).values || [];
    if (!mine.length) return null;
    var others = Object.keys(state.lists)
      .filter(function (m) { return m !== mode; })
      .map(function (m) { return state.lists[m].values || []; });

    var unique = mine.filter(function (v) {
      return !others.some(function (o) { return o.indexOf(v) !== -1; });
    }).sort();
    if (unique.length) return base + has(unique[0]);

    var sel = base + has(mine.slice().sort()[0]);
    others.forEach(function (o) {
      var extra = o.filter(function (v) { return mine.indexOf(v) === -1; }).sort();
      if (extra.length) sel += ":not(" + has(extra[0]) + ")";
    });
    return sel;
  }

  function buildCss() {
    var blocks = ["/* settings page */", ".lsf-empty{opacity:.75;padding:.5rem 0}"].join("\n");
    var rules = [];
    if (state.enabled) {
      Object.keys(state.lists).forEach(function (mode) {
        var hide = state.hidden[mode] || [];
        if (!hide.length) return;
        var menu = menuSelector(mode);
        if (!menu) return;
        var forms = [menu, '.sort-by-select .dropdown-menu[data-lsf="' + mode + '"]'];
        var selectors = [];
        forms.forEach(function (m) {
          hide.forEach(function (v) {
            selectors.push(m + ' .dropdown-item[data-value="' + v + '"]');
          });
        });
        rules.push("/* " + mode + " */\n" + selectors.join(",\n") + "{display:none !important}");
      });
    }
    return blocks + (rules.length ? "\n\n" + rules.join("\n\n") : "");
  }

  function applyCss() {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    var css = buildCss();
    if (style.textContent !== css) style.textContent = css;
    if (!HAS_SUPPORT) startMenuObserver();
  }

  // Fallback for browsers without :has(): stamp each menu with the mode whose
  // known values it matches.
  var menuObserver = null;
  function stampMenus() {
    var menus = document.querySelectorAll(".sort-by-select .dropdown-menu");
    for (var i = 0; i < menus.length; i++) {
      var menu = menus[i];
      if (menu.hasAttribute("data-lsf")) continue;
      var items = menu.querySelectorAll(".dropdown-item[data-value]");
      if (!items.length) continue;
      var values = [];
      for (var j = 0; j < items.length; j++) values.push(items[j].getAttribute("data-value"));
      var modes = Object.keys(state.lists);
      for (var k = 0; k < modes.length; k++) {
        var known = state.lists[modes[k]].values || [];
        var same = known.length === values.length && known.every(function (v) {
          return values.indexOf(v) !== -1;
        });
        if (same) { menu.setAttribute("data-lsf", modes[k]); break; }
      }
    }
  }
  function startMenuObserver() {
    if (menuObserver) return;
    menuObserver = new MutationObserver(stampMenus);
    menuObserver.observe(document.body, { childList: true, subtree: true });
    stampMenus();
  }

  /* ---------- settings page ----------
   * PluginSettings is patched, and the panel built from Stash's own
   * SettingGroup / BooleanSetting, which brings the native look and the
   * collapsing with it. The only thing left to the DOM is the block's own
   * description: Stash prints that from the (English, untranslatable) YAML,
   * outside the patched part. */

  var listeners = [];
  function notifySettings() { listeners.forEach(function (fn) { fn(); }); }

  function setEnabled(on) {
    state.enabled = on;
    writeConfig();
    applyCss();
    notifySettings();
  }

  function setShown(mode, value, shown) {
    var hide = (state.hidden[mode] || []).filter(function (v) { return v !== value; });
    if (!shown) hide.push(value);
    if (hide.length) state.hidden[mode] = hide; else delete state.hidden[mode];
    writeConfig();
    applyCss();
    notifySettings();
  }

  function makePanel(api) {
    var React = api.React;
    var Intl = api.libraries && api.libraries.Intl;

    return function ListSortFilterSettings() {
      var C = api.components;
      var intl = Intl && Intl.useIntl ? Intl.useIntl() : null;
      var redraw = React.useState(0)[1];
      var ref = React.useRef(null);

      // Redraw when the config arrives, or when a list is seen while this page
      // is open.
      React.useEffect(function () {
        function onChange() { redraw(function (n) { return n + 1; }); }
        listeners.push(onChange);
        return function () {
          listeners = listeners.filter(function (fn) { return fn !== onChange; });
        };
      }, []);

      // Stash prints the plugin's name and description above this panel from
      // the YAML, and does not translate them.
      React.useEffect(function () {
        var group = ref.current && ref.current.closest
          ? ref.current.closest(".setting-group") : null;
        var sub = group ? group.querySelector(".setting .sub-heading") : null;
        if (sub && sub.textContent !== t("pluginDescription")) {
          sub.textContent = t("pluginDescription");
        }
      });

      // Stash's own wording for a sort option / a list, in the UI language.
      function say(id, fallback) {
        if (!intl || !id) return fallback;
        return intl.formatMessage({ id: id, defaultMessage: fallback });
      }

      var children = [React.createElement(C.BooleanSetting, {
        key: "enabled",
        id: "lsf-enabled",
        heading: t("pluginEnabled"),
        subHeading: t("pluginEnabledDesc"),
        checked: state.enabled,
        onChange: setEnabled,
      })];

      var modes = Object.keys(state.lists).sort();
      if (!modes.length) {
        children.push(React.createElement("div", { key: "empty", className: "lsf-empty" }, t("empty")));
      }

      modes.forEach(function (mode) {
        var list = state.lists[mode];
        var hide = state.hidden[mode] || [];
        var entries = list.values.map(function (value) {
          return React.createElement(C.BooleanSetting, {
            key: value,
            id: "lsf-" + mode + "-" + value,
            heading: say(list.messages[value], value) + " (" + value + ")",
            checked: hide.indexOf(value) === -1,
            onChange: function (shown) { setShown(mode, value, shown); },
          });
        });
        children.push(React.createElement(C.SettingGroup, {
          key: mode,
          collapsible: true,
          collapsedDefault: true,
          settingProps: {
            heading: say(mode.toLowerCase(), mode),
            subHeading: sectionText(list.values.length, hide.length),
          },
        }, entries));
      });

      return React.createElement("div", { className: "plugin-settings", ref: ref }, children);
    };
  }

  /* ---------- wiring ---------- */

  (function patch() {
    var api = window.PluginApi;
    if (!api || !api.patch || !api.React) return; // older Stash: nothing to do

    LIST_COMPONENTS.forEach(function (name) {
      api.patch.before(name, function (props) {
        try { record(props && props.filter); } catch (e) {}
        return arguments;
      });
    });

    var Panel = makePanel(api);
    api.patch.instead("PluginSettings", function (props, second, next) {
      // Other plugins' settings, and this one before Stash's settings
      // components exist, are left to Stash.
      if (!props || props.pluginID !== PLUGIN_ID) return next(props, second);
      if (!api.components || !api.components.BooleanSetting || !api.components.SettingGroup) {
        return next(props, second);
      }
      return api.React.createElement(Panel, props);
    });
  })();

  var loaded = false;
  var refreshing = false;
  function refresh() {
    if (loaded) applyCss();
    if (refreshing) return;
    refreshing = true;
    readConfig().then(function (cfg) {
      refreshing = false;
      if (!cfg) return; // request failed: leave everything as it is (fail open)
      lang = pickLang(cfg.language);
      var on = asBool(cfg.settings.enabled);
      state.enabled = on === null ? true : on;
      var stored = parse(cfg.settings.lists, {});
      // Anything a list component has already reported wins over the stored copy.
      Object.keys(stored).forEach(function (mode) {
        if (!state.lists[mode]) state.lists[mode] = stored[mode];
      });
      var hidden = parse(cfg.settings.hidden, {});
      Object.keys(hidden).forEach(function (mode) {
        if (!state.hidden[mode]) state.hidden[mode] = hidden[mode];
      });
      loaded = true;
      // First run, or a list that rendered before this answer came back: what is
      // in hand now differs from what is stored, so store it.
      if (on === null
          || JSON.stringify(state.lists) !== cfg.settings.lists
          || JSON.stringify(state.hidden) !== cfg.settings.hidden) {
        writeConfig();
      }
      applyCss();
      notifySettings();
    });
  }

  refresh();

  ["pushState", "replaceState"].forEach(function (fn) {
    var original = history[fn];
    history[fn] = function () {
      var result = original.apply(this, arguments);
      refresh();
      return result;
    };
  });
  window.addEventListener("popstate", refresh);
})();
