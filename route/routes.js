const express = require('express');
const session = require('express-session');
const connection = require('../connection/db');
const route = express.Router();
const path = require('path');
const fs = require('fs');
const { request, response } = require('express');

// Main Route
route.get('/', function (request, response) {
    const query = "SELECT tb_music.id,title,cover_music,music,tb_artis.photo AS photo,tb_artis.name as name_artis,tb_genre.name AS genre, tb_artis.start_career AS start_career, tb_artis.about AS about FROM tb_music INNER JOIN tb_artis ON tb_music.artis_id = tb_artis.id INNER JOIN tb_genre ON tb_music.genre_id = tb_genre.id";
    connection.query(query, function (err, result) {
        if (err) { console.log(err) }
        let validation = "";
        const data = result;

        if (result.length < 1) {
            validation = "image_banner.svg";
        }

        const statusLogin = request.session.statusLogin;
        const userEmail = request.session.user_email;
        response.render('index', { data, statusLogin, validation, userEmail });
    });
});

// Route Search
route.post('/search', function (request, response) {
    const search = request.body.search;

    const query = `SELECT tb_music.id,title,cover_music,music,tb_artis.photo AS photo,tb_artis.name as name_artis,tb_genre.name AS genre, tb_artis.about AS about FROM tb_music INNER JOIN tb_artis ON tb_music.artis_id = tb_artis.id INNER JOIN tb_genre ON tb_music.genre_id = tb_genre.id WHERE title LIKE "%${search}%"`;

    if (search == "") {
        const selectAll = `SELECT tb_music.id,title,cover_music,music,tb_artis.photo AS photo,tb_artis.name as name_artis,tb_genre.name AS genre, tb_artis.about AS about FROM tb_music INNER JOIN tb_artis ON tb_music.artis_id = tb_artis.id INNER JOIN tb_genre ON tb_music.genre_id = tb_genre.id`;
        connection.query(selectAll, function (err, result) {
            if (err) { console.log(err) }
            let validation = "";
            const data = result;

            if (result.length < 1) {
                validation = "image_banner.svg";
            }
            else {
                validation = "";
            }
            const statusLogin = request.session.statusLogin;
            response.render('index', { data, statusLogin, validation });
        });
    }
    else {
        connection.query(query, function (err, result) {
            if (err) { console.log(err) }
            let validation = "";
            const data = result;

            if (result.length <= 0) {
                validation = "banner-music.png";
            }
            else {
                validation = "";
            }
            const statusLogin = request.session.statusLogin;
            response.render('index', { data, statusLogin, validation });
        });
    }

});

// Route Logout
route.get('/logout', function (request, response) {
    request.session.statusLogin = false;
    request.session.destroy(function (err) {
        if (err) { console.log(err) }
    });

    response.redirect('/');
});

// Route Register
route.post('/register', function (request, response) {
    const email = request.body.email;
    const password = request.body.password;

    const validasiEmail = `SELECT * FROM tb_user WHERE email = "${email}"`;
    connection.query(validasiEmail, function (err, result) {
        if (err) { console.log(err) }
        if (result.length > 0) {
            request.session.message = {
                icon: "error",
                title: "E-mail Already Registered"
            }
            response.redirect('/');
        }
        else {
            const query = `INSERT INTO tb_user (email,password,status) VALUES ("${email}","${password}","2")`;
            connection.query(query, function (err, result) {
                if (err) { console.log(err) }
                request.session.message = {
                    icon: "success",
                    title: "Successful Registration"
                }
                response.redirect('/');
            });
        }
    });
});

// Route Login
route.post('/login', function (request, response) {
    const email = request.body.email;
    const password = request.body.password;

    const query = `SELECT * FROM tb_user WHERE email = "${email}" AND password = "${password}"`;
    connection.query(query, function (err, result) {
        if (err) { console.log(err) }

        if (result.length == 0) {
            request.session.message = {
                icon: "error",
                title: "Check Your Email And Password Again"
            }
            response.redirect('/');
        }
        else {
            request.session.statusLogin = true;
            request.session.user_id = result[0].id;
            request.session.user_email = result[0].email;
            request.session.user_status = result[0].status;

            if (email == "jayamiko4@gmail.com") {
                request.session.message = {
                    icon: "success",
                    title: `Welcome Admin${email}`
                }
                response.redirect('/home');
            }
            else {
                request.session.message = {
                    icon: "success",
                    title: `Welcome ${email}`
                }
                response.redirect('/')
            }
        }
    });
});

//Playlist 
route.post('/playlist', function (request, response) {
    if (request.session.statusLogin) {
        const name = request.body.name;
        const music_id = request.body.music_id;
        const user_id = request.session.user_id;

        const query = `INSERT INTO tb_playlist (name,music_id,user_id) VALUES ("${name}","${music_id}",${user_id})`;
        connection.query(query, function (err, result) {
            if (err) { console.log(err) }
            request.session.message = {
                icon: "success",
                title: "Successfully Added To Your Playlist"
            }
            response.redirect('/');
        });
    }
    else {
        request.session.message = {
            icon: "error",
            title: "Please Login First"
        }
        response.redirect('/');
    }
});
route.get('/detail-playlist', function (request, response) {
    const userId = request.session.user_id;
    const query = `SELECT tb_playlist.id,name,tb_music.music AS music FROM tb_playlist INNER JOIN tb_music ON tb_playlist.music_id = tb_music.id WHERE user_id = ${userId}`;
    connection.query(query, function (err, result) {
        if (err) { console.log(err) }

        let validation = "";
        const data = result;
        if (result.length < 1) {
            validation = "icon-music.png";
        }
        else {
            validation = "";
        }
        response.render('detail_playlist', { data, validation });
    });
});
route.get('/delete-playlist/:id', function (request, response) {
    const id = request.params.id;

    const query = `DELETE FROM tb_playlist WHERE id = ${id}`;
    connection.query(query, function (err, result) {
        if (err) { console.log(err) }
        request.session.message = {
            icon: "success",
            title: "Playlist Deleted"
        };
        response.redirect('/detail-playlist');
    });
});


// Route Genre
route.get('/genre', function (request, response) {
    const statusLogin = request.session.statusLogin;

    if (statusLogin) {
        const title = "Genre Music";
        const query = `SELECT * FROM tb_genre`;
        connection.query(query, function (err, result) {
            const data = result;
            response.render('genre', { title, data, active: { genre: true } });
        });
    }
    else {
        response.redirect('/');
    }
});
route.post('/genre', function (request, response) {
    const genre = request.body.genre;

    if (genre == "") {
        request.session.message = {
            icon: "error",
            title: "Form Must Be Filled"
        };
        return response.redirect('/genre');
    }
    else {
        const query = `INSERT INTO tb_genre (name) VALUES ("${genre}")`;
        connection.query(query, function (err, result) {
            if (err) { console.log(err) };
            request.session.message = {
                icon: "success",
                title: "Data Saved Successfully"
            };
            response.redirect('/genre');
        });
    }
});
route.get('/delete-genre/:id', function (request, response) {
    const id = request.params.id;
    const validasiId = `SELECT * FROM tb_music WHERE genre_id = ${id}`;
    connection.query(validasiId, function (err, result) {
        if (err) { err }
        if (result.length < 1) {
            const query = `DELETE FROM tb_genre WHERE id = ${id} `;
            connection.query(query, function (err, result) {
                if (err) { err }
                request.session.message = {
                    icon: "success",
                    title: "Data Deleted Successfully"
                };
                response.redirect('/genre');
            });
        }
        else {
            request.session.message = {
                icon: "warning",
                title: "Data Cannot Be Erased"
            };
            response.redirect('/genre');
        }
    });
});
route.post('/update-genre/:id', function (request, response) {
    const id = request.params.id;
    const genre = request.body.genre;
    if (genre == "") {
        request.session.message = {
            icon: "error",
            title: "form must be Filled"
        };
        return response.redirect('/genre');
    }
    else {
        const query = `UPDATE tb_genre SET name = "${genre}", update_at = CURRENT_TIME WHERE id = ${id}`;
        connection.query(query, function (err, result) {
            if (err) { err }
            request.session.message = {
                icon: "success",
                title: "Data Changed Successfully"
            };
            response.redirect('/genre');
        });
    }
});

// Route Artis
route.get('/artis', function (request, response) {
    const title = "Artis";
    const query = `SELECT * FROM tb_artis`;
    const statusLogin = request.session.statusLogin;

    if (statusLogin) {
        connection.query(query, function (err, result) {
            if (err) { console.log(err) }
            const data = result;
            response.render('artis', { title, data, active: { artis: true } });
        });
    }
    else {
        response.redirect('/');
    }
});
route.post('/artis', function (request, response) {
    const name = request.body.name;
    const start_career = request.body.start_career;
    const about = request.body.about;

    if (name == "" && start_career == "" && about == "") {
        request.session.message = {
            icon: "warning",
            title: "form must be Filled Semua"
        };
        response.redirect('/artis');
    }
    else {
        const pathFile = path.join(__dirname + "/../upload/img/");
        const filePhoto = request.files.photo;
        const namePhoto = Date.now() + filePhoto.name.replace(/\s/g, "");
        const uploadToFolder = pathFile + namePhoto;

        filePhoto.mv(uploadToFolder, function (err) {
            if (err) { console.log(err) }
        });

        const query = `INSERT INTO tb_artis (name,start_career,photo,about) VALUES ("${name}","${start_career}","${namePhoto}","${about}")`;
        connection.query(query, function (err, result) {
            if (err) { console.log(err) }
            request.session.message = {
                icon: "success",
                title: "Data Saved Successfully"
            };
            response.redirect('/artis');
        });
    }

});
route.get('/delete-artis/:id', function (request, response) {
    const id = request.params.id;
    const validasiId = `SELECT * FROM tb_music WHERE artis_id = ${id}`;
    connection.query(validasiId, function (err, result) {
        if (err) { err }
        if (result.length < 1) {
            const query = `DELETE FROM tb_artis WHERE id = ${id} `;
            connection.query(query, function (err, result) {
                if (err) { err }
                request.session.message = {
                    icon: "success",
                    title: "Data Deleted Successfully"
                };
                response.redirect('/artis');
            });
        }
        else {
            request.session.message = {
                icon: "warning",
                title: "Data Cannot Be Erased"
            };
            response.redirect('/artis');
        }
    });
});
route.post('/update-artis/:id', function (request, response) {
    const id = request.params.id;
    const name = request.body.name;
    const start_career = request.body.start_career;
    const about = request.body.about;
    let old_photo = request.body.old_photo;
    const pathFile = path.join(__dirname + "/../upload/img/");

    if (request.files) {
        const photo = request.files.photo;
        old_photo = Date.now() + request.files.photo.name.replace(/\s/g, "");

        const queryFindData = `SELECT * FROM tb_artis WHERE id = ${id}`;
        connection.query(queryFindData, function (err, result) {
            fs.unlinkSync(pathFile + result[0].photo);
            photo.mv(pathFile + old_photo, function (err) {
                if (err) { console.log(err) }
            });
        });
    }

    if (name == "" && start_career == "" && about == "") {
        request.session.message = {
            icon: "warning",
            title: "form must be Filled Semua"
        };
        response.redirect('/artis');
    }
    else {
        const query = `UPDATE tb_artis SET name = "${name}", start_career = "${start_career}", about = "${about}",photo = "${old_photo}", update_at = CURRENT_TIME WHERE id = ${id}`;
        connection.query(query, function (err, result) {
            if (err) { console.log(err) }
            request.session.message = {
                icon: "success",
                title: "Data Updated Successfully"
            };
            response.redirect('/artis');
        });
    }
});

// Route Music
route.get('/music', function (request, response) {
    const title = "Music";
    const queryGenre = "SELECT * FROM tb_genre";
    const queryArtis = "SELECT * FROM tb_artis";
    const queryData = "SELECT tb_music.id,title,music,cover_music,tb_genre.name AS name_genre,tb_artis.name AS name_artis FROM tb_music INNER JOIN tb_genre ON tb_music.genre_id = tb_genre.id INNER JOIN tb_artis ON tb_music.artis_id = tb_artis.id";
    const statusLogin = request.session.statusLogin;

    if (statusLogin) {
        connection.query(queryGenre, function (err, result) {
            if (err) { console.log(err) }
            const getGenre = result;

            connection.query(queryArtis, function (err, result) {
                if (err) { console.log(err) }
                const getArtis = result;

                connection.query(queryData, function (err, result) {
                    if (err) { console.log(err) }
                    const data = result;
                    response.render('music', { title, getArtis, getGenre, data, active: { music: true } });
                });

            });

        });
    }
    else {
        response.redirect('/');
    }
});
route.post('/music', function (request, response) {
    const title = request.body.title;
    const genre_id = request.body.genre_id;
    const artis_id = request.body.artis_id;

    //upload file cover music
    const pathFile = path.join(__dirname + "/../upload/");
    const fileCoverMusic = request.files.cover_music;
    const fileNameCoverMusic = Date.now() + fileCoverMusic.name.replace(/\s/g, "");
    const filePathCoverMusic = pathFile + 'img/' + fileNameCoverMusic;
    fileCoverMusic.mv(filePathCoverMusic, function (err) {
        if (err) { console.log(err) }
    });

    //upload file music
    const fileMusic = request.files.music;
    const fileNameMusic = Date.now() + fileMusic.name.replace(/\s/g, "");
    const filePathMusic = pathFile + 'music/' + fileNameMusic;
    fileMusic.mv(filePathMusic, function (err) {
        if (err) { console.log(err) }
    });

    const query = `INSERT INTO tb_music (title,music,cover_music,genre_id,artis_id) VALUES ("${title}","${fileNameMusic}","${fileNameCoverMusic}",${genre_id},"${artis_id}")`;
    connection.query(query, function (err, result) {
        if (err) { console.log(err) }
        request.session.message = {
            icon: "success",
            title: "Data Saved Successfully"
        };
        response.redirect('/music');
    });

});
route.get('/delete-music/:id', function (request, response) {
    const id = request.params.id;

    const query = `SELECT * FROM tb_music WHERE id= ${id}`;
    connection.query(query, function (err, result) {
        if (err) { console.log(err) }
        // Delete Cover Music
        const pathFile = path.join(__dirname + "/../upload/");
        const pathFileCoverMusic = pathFile + 'img/' + result[0].cover_music;
        fs.unlinkSync(pathFileCoverMusic);

        // Delete Cover Music
        const pathFileMusic = pathFile + 'music/' + result[0].music;
        fs.unlinkSync(pathFileMusic);

        const query = `DELETE FROM tb_music WHERE id= ${id}`;
        connection.query(query, function (err, result) {
            if (err) { console.log(err) }
            request.session.message = {
                icon: "success",
                title: "Data Deleted Successfully"
            };
            response.redirect('/music');
        });
    });
});

// Route Home
route.get('/home', function (request, response) {
    const title = "Home";
    const emailUser = request.session.user_email;


    if (emailUser == "jayamiko4@gmail.com") {
        response.render('home', { title, emailUser, active: { home: true } });
    }
    else {
        response.redirect('/');
    }
});

module.exports = route;