//vaja lisada kasutatavad paketid enne rakenduse initsialisseerimist
const express = require("express");
const axios = require("axios");

const app = express();

app.set("view engine", "ejs"); //ejs on extention, hakkab haldama vaadet, pakib html'i andmetega kokku ja saadab kasutajale
app.use(express.static("public")); //mis kaustast lubame faile välja saata

app.get("/", (req, res)=>{ //request ja response
    let url = "https://api.themoviedb.org/3/movie/550988?api_key=6a6c8ee1cff0ffdd4d8f2e87490dfa98";
    axios.get(url)
    .then(response => { //.then paneb koodi natuke ootele, kuna peame serverilt saama kõigepealt vastuse (andmed või veateade)
        let data = response.data;
        //console.log(data.title);

        let releaseDate = new Date(data.release_date).getFullYear(); //mitte kogu kuupäeva, vaid ainult aasta

        let genresToDisplay = "";
        data.genres.forEach(genre => { //genres on jsonist, peame läbi loop'ima, genre on elemendi nimi, mille ise panime
            genresToDisplay = genresToDisplay + `${genre.name}, `; //koma lisab loetelu vahele koma ja järel on tühik
            //console.log(genresToDisplay);
        });

        let genresUpdated = genresToDisplay.slice(0, -2) + "."; //alustades 0'st, lõikab lausest viimase elementi (-2) ehk viimase koma ja paneb . asemele
        //console.log(genresUpdated);

        let posterUrl = `https://www.themoviedb.org/t/p/w600_and_h900_bestv2${data.poster_path}`;


        let currentYear = new Date().getFullYear();


        res.render("index", { //render ehk kuva; kõik andmed, mis on saadud serverilt, on salvestatud nendesse objektidesse ja sealt saab süstida andmeid index šablooni
            dataToRender: data, 
            year: currentYear, 
            releaseYear: releaseDate,
            genres: genresUpdated,
            poster: posterUrl
        });
    
    });
   
   
});

app.listen(process.env.PORT || 3000, ()=>{ //localhost 3000 on meie masin, lisasime siia ette, et ei oleks rangelt seaotud pordiga 3000, vaid on vabadus valida port, et panna kood käima
    console.log("Server is running on Port 3000.");
});