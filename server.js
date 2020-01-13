var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
var bodyParser = require('body-parser');
var mysql = require('mysql');
var methodOverride = require('method-override');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 5559);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(methodOverride('_method'));

var pool = mysql.createPool(
{
    host            : 'classmysql.engr.oregonstate.edu',
    user            : 'cs340_bernstes',
    password        : '4235',
	database        : 'cs340_bernstes'
	
});

/* get users to populate in dropdown */
//This code is referenced from professor's github example
function getUsers(res, mysql, context, complete){
	pool.query("SELECT id AS user_id, first_name, last_name FROM user", function(error, results, fields){
		if(error){
			res.write(JSON.stringify(error));
			res.end();
		}
		context.users = results;
		complete();
	});
}

/* get movies to populate in dropdown */
//This code is referenced from professor's github example
function getMovies(res, mysql, context, complete){
	pool.query("SELECT id AS movie_id, title FROM movies", function(error, results, fields){
		if(error){
			res.write(JSON.stringify(error));
			res.end();
		}
		context.movies = results;
		complete();
	});
}

/* get actors to populate in dropdown */
//This code is referenced from professor's github example
function getActors(res, mysql, context, complete){
	pool.query("SELECT id AS actor_id, first_name, last_name FROM actors", function(error, results, fields){
		if(error){
			res.write(JSON.stringify(error));
			res.end();
		}
		context.actors = results;
		complete();
	});
}

/* get genres to populate in dropdown */
//This code is referenced from professor's github example
function getGenres(res, mysql, context, complete){
	pool.query("SELECT id AS genre_id, name FROM genre", function(error, results, fields){
		if(error){
			res.write(JSON.stringify(error));
			res.end();
		}
		context.genres = results;
		complete();
	});
}

app.get('/movies', function(req, res, next)
{
	var context = {};
	pool.query('SELECT m.id, title, year, duration, name FROM movies m INNER JOIN genre g ON m.genre_id = g.id ORDER BY title ASC', function(err, rows, fields)
    {
        if(err)
        {
            next(err);
            return;
        }
        context.movies = rows;
		res.render('movies', context);
    });
});

app.get('/', function(req, res, next)
{
	res.redirect('/movies');
});

app.get('/movies/new', function(req, res, next)
{
	var callbackCount = 0;
	var context = {};
	var mysql = req.app.get('mysql');
	var handlebars_file = 'newMovie';

	getGenres(res, mysql, context, complete);
	var genres = req.body.genres;

	function complete(){
		callbackCount++;
		if(callbackCount >= 1){
			res.render(handlebars_file, context);
		}
	}
});

app.post('/movies', function(req, res, next)
{
	var genres = req.body.genres;
    pool.query('INSERT INTO movies(title, year, duration, genre_id) VALUES(?,?,?,?)',
    [req.body.title, req.body.year, req.body.duration, req.body.genre_id], function(err, result)
    {
    	if(err)
    	{
    		next(err);
    		return;
    	}
    	res.redirect('/movies');
    });
});

app.get('/movies/:id', function(req, res, next)
{
	var context = {};
	pool.query('SELECT m.id, title, year, duration, name FROM movies m INNER JOIN genre g ON m.genre_id = g.id WHERE m.id = ?', [req.params.id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.movies = result;
		res.render('showMovies', context);
	});

});

app.get('/movies/:id/edit', function(req, res, next)
{
	var context = {};
	pool.query('SELECT m.id, title, year, duration, name FROM movies m INNER JOIN genre g ON m.genre_id = g.id WHERE m.id = ?', [req.params.id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.movies = result;
		var callbackCount = 0;
		var mysql = req.app.get('mysql');
		var handlebars_file = 'editMovie';

		getGenres(res, mysql, context, complete);
		var genres = req.body.genres;

		function complete(){
			callbackCount++;
			if(callbackCount >= 1){
				res.render(handlebars_file, context);
		}
	}
		//res.render('editMovie', context);
	});
});

app.put('/movies/:id', function(req, res, next)
{
    pool.query('UPDATE movies m INNER JOIN genre g ON m.genre_id = g.id SET title = ?, year = ?, duration = ?, genre_id = ? WHERE m.id = ?', 
        [req.body.title, req.body.year, req.body.duration, req.body.genre_id, req.params.id], function(err, result)
        {
            if(err)
            {
                next(err);
                return;
            }
            res.redirect('/movies');
        });
});

app.delete('/movies/:id', function(req, res, next)
{
    pool.query('DELETE FROM movies WHERE id = ?', [req.params.id], function(err)
    {
        if(err)
        {
            next(err);
            return;
        }
        res.redirect('/movies');
    });
});

app.get('/genre', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, name FROM genre ORDER BY name ASC', function(err, rows, fields)
    {
        if(err)
        {
            next(err);
            return;
        }
        context.genre = rows;
		res.render('genre', context);
    });
});

app.get('/', function(req, res, next)
{
	res.redirect('/genre');
});

app.get('/genre/new', function(req, res, next)
{
	res.render('newGenre');
});

app.post('/genre', function(req, res, next)
{
    pool.query('INSERT INTO genre(name) VALUES(?)',[req.body.name], function(err, result)
    {
    	if(err)
    	{
    		next(err);
    		return;
    	}
    	res.redirect('/genre');
    });
});

app.get('/genre/:id', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, name FROM genre WHERE id = ?', [req.params.id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.genre = result;
		res.render('showGenre', context);
	});
});


app.get('/genre/:id/edit', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, name FROM genre WHERE id = ?', [req.params.id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.genre = result;
		res.render('editGenre', context);
	});
});

app.put('/genre/:id', function(req, res, next)
{
    pool.query('UPDATE genre SET name = ? WHERE id = ?', [req.body.name, req.params.id], function(err, result)
        {
            if(err)
            {
                next(err);
                return;
            }
            res.redirect('/genre');
        });
});

app.get('/user', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, first_name, last_name FROM user ORDER BY last_name ASC', function(err, rows, fields)
    {
        if(err)
        {
            next(err);
            return;
        }
        context.user = rows;
		res.render('user', context);
    });
});

app.get('/', function(req, res, next)
{
	res.redirect('/user');
});

app.get('/user/new', function(req, res, next)
{
	res.render('newUser');
});

app.post('/user', function(req, res, next)
{
    pool.query('INSERT INTO user(first_name, last_name, email, credit_card) VALUES(?,?,?,?)',
    [req.body.first_name, req.body.last_name, req.body.email, req.body.credit_card], function(err, result)
    {
    	if(err)
    	{
    		next(err);
    		return;
    	}
    	res.redirect('/user');
    });
});

app.get('/user/:id', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, first_name, last_name, email, credit_card FROM user WHERE id = ?', [req.params.id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.user = result;
		res.render('showUser', context);
	});

});

app.get('/user/:id/edit', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, first_name, last_name, email, credit_card FROM user WHERE id = ?', [req.params.id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.user = result;
		res.render('editUser', context);
	});
});

app.put('/user/:id', function(req, res, next)
{
    pool.query('UPDATE user SET first_name = ?, last_name = ?, email = ?, credit_card = ? WHERE id = ?', 
        [req.body.first_name, req.body.last_name, req.body.email, req.body.credit_card, req.params.id], function(err, result)
        {
            if(err)
            {
                next(err);
                return;
            }
            res.redirect('/user');
        });
});

app.delete('/user/:id', function(req, res, next)
{
    pool.query('DELETE FROM user WHERE id = ?', [req.params.id], function(err)
    {
        if(err)
        {
            next(err);
            return;
        }
        res.redirect('/user');
    });
});

app.get('/actors', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, first_name, last_name FROM actors ORDER BY last_name ASC', function(err, rows, fields)
    {
        if(err)
        {
            next(err);
            return;
        }
        context.actors = rows;
		res.render('actors', context);
    });
});

app.get('/', function(req, res, next)
{
	res.redirect('/actors');
});

app.get('/actors/new', function(req, res, next)
{
	res.render('newActor');
});

app.post('/actors', function(req, res, next)
{
    pool.query('INSERT INTO actors(first_name, last_name) VALUES(?,?)',
    [req.body.first_name, req.body.last_name], function(err, result)
    {
    	if(err)
    	{
    		next(err);
    		return;
    	}
    	res.redirect('/actors');
    });
});

app.get('/actors/:id', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, first_name, last_name FROM actors WHERE id = ?', [req.params.id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.actors = result;
		res.render('showActor', context);
	});

});

app.get('/actors/:id/edit', function(req, res, next)
{
	var context = {};
	pool.query('SELECT id, first_name, last_name FROM actors WHERE id = ?', [req.params.id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.actors = result;
		res.render('editActor', context);
	});
});

app.put('/actors/:id', function(req, res, next)
{
    pool.query('UPDATE actors SET first_name = ?, last_name = ? WHERE id = ?', 
        [req.body.first_name, req.body.last_name, req.params.id], function(err, result)
        {
            if(err)
            {
                next(err);
                return;
            }
            res.redirect('/actors');
        });
});

app.get('/views', function(req, res, next)
{
	var context = {};
   pool.query('SELECT v.user_movie_id, u.first_name, u.last_name, m.title, v.rating FROM views v INNER JOIN movies m ON v.movie_id = m.id INNER JOIN user u ON v.user_id = u.id'
   , function(err, rows, fields)
    {
        if(err)
        {
            next(err);
            return;
        }
        context.views = rows;
		res.render('views', context);
    });
});
/*
app.get('/', function(req, res, next)
{
	res.redirect('/views');
});
*/

app.get('/views/new', function(req, res, next)
{
	var callbackCount = 0;
	var context = {};
	var mysql = req.app.get('mysql');
	var handlebars_file = 'newView';

	getUsers(res, mysql, context, complete);
	getMovies(res, mysql, context, complete);

	var users = req.body.users;
	var movies = req.body.movies;

	function complete(){
		callbackCount++;
		if(callbackCount >= 2){
			res.render(handlebars_file, context);
		}
	}
});


app.post('/views', function(req, res, next)
{
	var users = req.body.users;
	var movies = req.body.movies;
	pool.query('INSERT INTO views(user_id, movie_id, rating) VALUES(?,?,?)',
	[req.body.user_id, req.body.movie_id, req.body.rating], function(err, result)
    {
    	if(err)
    	{
    		next(err);
    		return;
    	}
		res.redirect('/views');
		
    });
});

app.get('/views/:user_movie_id', function(req, res, next)
{
	var context = {};
	pool.query('SELECT v.user_movie_id, u.first_name, u.last_name, m.title, v.rating FROM views v INNER JOIN movies m ON v.movie_id = m.id INNER JOIN user u ON v.user_id = u.id WHERE v.user_movie_id = ?', [req.params.user_movie_id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.views = result;
		res.render('showView', context);
	});

});

app.get('/views/:user_movie_id/edit', function(req, res, next)
{
	var context = {};
	pool.query('SELECT v.user_movie_id, u.first_name, u.last_name, m.title, v.rating FROM views v INNER JOIN movies m ON v.movie_id = m.id INNER JOIN user u ON v.user_id = u.id WHERE v.user_movie_id = ?', [req.params.user_movie_id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.views = result;
		var callbackCount = 0;
	var mysql = req.app.get('mysql');
	var handlebars_file = 'editView';

	getUsers(res, mysql, context, complete);
	getMovies(res, mysql, context, complete);

	var users = req.body.users;
	var movies = req.body.movies;

	function complete(){
		callbackCount++;
		if(callbackCount >= 2){
			res.render(handlebars_file, context);
		}
	}
	});
});


app.put('/views/:user_movie_id', function(req, res, next)
{
    pool.query('UPDATE views SET user_id=?, movie_id=?, rating=? WHERE user_movie_id = ?', 
        [req.body.user_id, req.body.movie_id, req.body.rating, req.params.user_movie_id], function(err, result)
        {
            if(err)
            {
                next(err);
                return;
            }
            res.redirect('/views');
        });
});

app.delete('/views/:user_movie_id', function(req, res, next)
{
    pool.query('DELETE FROM views WHERE user_movie_id = ?', [req.params.user_movie_id], function(err)
    {
        if(err)
        {
            next(err);
            return;
        }
        res.redirect('/views');
    });
});

app.get('/acts_in', function(req, res, next)
{
	var context = {};
	pool.query('SELECT movie_actor_id, first_name, last_name, title FROM actors a INNER JOIN acts_in ai ON a.id = ai.actor_id INNER JOIN movies m ON ai.movie_id = m.id', function(err, rows, fields)
    {
        if(err)
        {
            next(err);
            return;
        }
        context.acts_in = rows;
		res.render('acts_in', context);
    });
});
/*
app.get('/', function(req, res, next)
{
	res.redirect('/acts_in');
});
*/
app.get('/acts_in/new', function(req, res, next)
{
	var callbackCount = 0;
	var context = {};
	var mysql = req.app.get('mysql');
	var handlebars_file = 'newActs_In';

	getActors(res, mysql, context, complete);
	getMovies(res, mysql, context, complete);

	var actors = req.body.actors;
	var movies = req.body.movies;

	function complete(){
		callbackCount++;
		if(callbackCount >= 2){
			res.render(handlebars_file, context);
		}
	}
});

app.post('/acts_in', function(req, res, next)
{
	var actors = req.body.actors;
	var movies = req.body.movies;
    pool.query('INSERT INTO acts_in(actor_id, movie_id) VALUES(?,?)',[req.body.actor_id, req.body.movie_id], function(err, result)
    {
    	if(err)
    	{
    		next(err);
    		return;
    	}
    	res.redirect('/acts_in');
    });
});

app.get('/acts_in/:movie_actor_id', function(req, res, next)
{
	var context = {};
	pool.query('SELECT movie_actor_id, first_name, last_name, title FROM actors a INNER JOIN acts_in ai ON a.id = ai.actor_id INNER JOIN movies m ON ai.movie_id = m.id WHERE movie_actor_id = ?', [req.params.movie_actor_id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.acts_in = result;
		res.render('showActs_In', context);
	});

});

app.get('/acts_in/:movie_actor_id/edit', function(req, res, next)
{
	var context = {};
	pool.query('SELECT movie_actor_id, first_name, last_name, title FROM actors a INNER JOIN acts_in ai ON a.id = ai.actor_id INNER JOIN movies m ON ai.movie_id = m.id WHERE movie_actor_id = ?', [req.params.movie_actor_id], function(err, result)
	{
		if(err)
		{
			next(err);
			return;
		}
		context.acts_in = result;
		res.render('editActs_In', context);
	});
});

app.put('/acts_in/:movie_actor_id', function(req, res, next)
{
    pool.query('UPDATE acts_in ai INNER JOIN actors a ON ai.actor_id=a.id INNER JOIN movies m ON ai.movie_id=m.id SET a.first_name = ?, a.last_name = ?, title = ? WHERE ai.movie_actor_id = ?', 
        [req.body.first_name, req.body.last_name, req.body.title, req.params.movie_actor_id], function(err, result)
        {
            if(err)
            {
                next(err);
                return;
            }
            res.redirect('/acts_in');
        });
});

app.delete('/acts_in/:movie_actor_id', function(req, res, next)
{
    pool.query('DELETE FROM acts_in WHERE movie_actor_id = ?', [req.params.movie_actor_id], function(err)
    {
        if(err)
        {
            next(err);
            return;
        }
        res.redirect('/acts_in');
    });
});

app.get('/search', function(req, res, next)
{
    context = {};
    pool.query('SELECT title, year, duration, name FROM movies m INNER JOIN genre g ON m.genre_id = g.id WHERE title=?',[req.query.title], function(err, result)
    {
        if(err)
        {
            next(err);
            return;
        }
        context.movies = result;
        res.render('searchResults', context);
    });
});

app.use(function(req, res) 
{
    res.status(404);
    res.render('404');
});

app.use(function(err, req, res, next) 
{
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function() 
{
    console.log('Express started on port ' + app.get('port') + '; press Ctrl-C to terminate.');
});