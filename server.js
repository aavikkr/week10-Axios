//vaja lisada kasutatavad paketid enne rakenduse initsialisseerimist
const express = require("express");
const axios = require("axios");
const http = require("http");
const app = express();

app.set("view engine", "ejs"); //ejs on extention, hakkab haldama vaadet, pakib html'i andmetega kokku ja saadab kasutajale
app.use(express.static("public")); //mis kaustast lubame faile välja saata
app.use(express.urlencoded({ extended: true })); // kuidas andmeid lahti lugeda
app.use(express.json());


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

app.get("/search", (req, res)=> {
    res.render("search", {movieDetails:"" }); //tahan saata search.ejs faili; võtab movieDetails andmed
});

app.post("/search", (req, res)=> {
    let userMovieTitle = req.body.movieTitle; //kasutaja sisestatud pealkiri
    console.log(userMovieTitle);

    //siit tuleb kogu filmi info,aga žanrid on kodeeritud
    let movieUrl= `https://api.themoviedb.org/3/search/movie?api_key=6a6c8ee1cff0ffdd4d8f2e87490dfa98&query=${userMovieTitle}`;
    //siin on api võtmed žanri koodidele
    let genresUrl = "https://api.themoviedb.org/3/genre/movie/list?api_key=6a6c8ee1cff0ffdd4d8f2e87490dfa98&language=en-US";

    //pakime lingid ühte massiivi kokku
    let endpoints = [movieUrl, genresUrl];

    axios.all(endpoints.map((endpoint) => axios.get(endpoint))) //oskab kasutada kõiki endpointe, map teeb midagi andmetega
    .then(axios.spread((movie, genres) => {
        const [movieRaw] = movie.data.results;
        //console.log(movie.data.results);

        let movieGenreIds = movieRaw.genre_ids; //konkreetsele filmile kuuluvad žanrid
        let movieGenres = genres.data.genres; //kõik žanrid TMDB andmebaasis
        let movieGenresArray = []; //peame võrdlema kahte eelmist ja salvestame ainult selle filmi žanrid, mis tal on
        
        for (let i = 0; i < movieGenreIds.length; i++) { //loop'ib läbi selle filmi žanrid
            for(let j = 0; j < movieGenres.length; j++) {//loop'ib läbi kõik TMDB žanrid
                if(movieGenreIds[i] === movieGenres[j].id){ 
                    movieGenresArray.push(movieGenres[j].name);
                }
            }
        }

        let genresToDisplay = "";
        movieGenresArray.forEach(genre => { //genres on jsonist, peame läbi loop'ima, genre on elemendi nimi, mille ise panime
            genresToDisplay = genresToDisplay + `${genre}, `; //koma lisab loetelu vahele koma ja järel on tühik
            //console.log(genresToDisplay);
        });

        genresToDisplay = genresToDisplay.slice(0, -2) + ".";

        let movieData = {
            title: movieRaw.title, 
            year: new Date(movieRaw.release_date).getFullYear(), 
            genres: genresToDisplay,
            overview: movieRaw.overview,
            posterUrl: `https://images.tmdb.org/t/p/w500${movieRaw.poster_path}`
        };

        res.render("search", {movieDetails: movieData}); //movie details objekti salvestame kõik movieData andmed
    }));

});



//new route - selle andis õppejõud ette
app.post('/getmovie', (req, res) => {
	const movieToSearch =
		req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.movie
			? req.body.queryResult.parameters.movie
			: '';

	const reqUrl = encodeURI(
		`http://www.omdbapi.com/?t=${movieToSearch}&apikey=f77d19f4`
	);
	http.get(
		reqUrl,
		responseFromAPI => {
			let completeResponse = ''
			responseFromAPI.on('data', chunk => {
				completeResponse += chunk
			})
			responseFromAPI.on('end', () => {
				const movie = JSON.parse(completeResponse);
                if (!movie || !movie.Title) {
                    return res.json({
                        fulfillmentText: 'Sorry, we could not find the movie you are asking for.',
                        source: 'getmovie'
                    });
                }

				let dataToSend = movieToSearch;
				dataToSend = `${movie.Title} was released in the year ${movie.Year}. It is directed by ${
					movie.Director
				} and stars ${movie.Actors}.\n Here some glimpse of the plot: ${movie.Plot}.`;

				return res.json({
					fulfillmentText: dataToSend,
					source: 'getmovie'
				});
			})
		},
		error => {
			return res.json({
				fulfillmentText: 'Could not get results at this time',
				source: 'getmovie'
			});
		}
	)
});




app.listen(process.env.PORT || 3000, ()=>{ //localhost 3000 on meie masin, lisasime siia ette, et ei oleks rangelt seaotud pordiga 3000, vaid on vabadus valida port, et panna kood käima
    console.log("Server is running on Port 3000.");
});