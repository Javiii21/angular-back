'use strict'
var bcrypt = require('bcrypt-nodejs');

var fs = require('fs');

var path = require('path');

var User = require('../models/user');

var jwt = require('../services/jwt')

function pruebas(req, res){
	res.status(200).send({
		message: 'Probando el controlador de usuarios y la acción de pruebas'
	});
}

function saveUser(req, res){
	//Crear objeto usuario
	var user = new User();

	//Recoger parametros peticion
	var params = req.body;

	//Asignar valores al objeto del usuario


	if(params.password && params.name && params.surname && params.email){
		user.name = params.name;
		user. surname = params.surname;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.image = null;

		User.findOne({email: user.email.toLowerCase()}, (err, issetUser) => {
			if (err){
				res.status(500).send({message: 'Error al comprobar el usuario'});
			}else{
				if(!issetUser){
					//Cifrar contraseña
					bcrypt.hash(params.password, null, null, function(err, hash){
						user.password = hash;

						//Guardar usuario en bd
						user.save((err, userStored) => {
							if(err){
								res.status(500).send({message: 'Error al guardar el usuario'});
							}else{
								if (!userStored) {
									res.status(404).send({message: 'No se ha registrado el usuario'});
								}else{
									res.status(200).send({user: userStored});
								}
							}
						});
					});

				}else{
					res.status(200).send({message: 'El usuario no puede registrarse'});
			}
		}
	});
	}else{
		res.status(200).send({message: 'Introduce los datos correctamente para registrarte'});
	}
}

function login(req, res){
	var params = req.body;
	var email = params.email;
	var password = params.password;
	User.findOne({email: email.toLowerCase()}, (err, user) => {
			if (err){
				res.status(500).send({message: 'Error al comprobar el usuario'});
			}else{
				if(user){
					bcrypt.compare(password, user.password, (err, check) =>{
						if (check){
							//Comprobar y generar el token
							if (params.gettoken) {
								//devolver el token
								res.status(200).send({
									token: jwt.createToken(user)
								});

							}else{
								res.status(200).send({user});
							}

						}else{
							res.status(404).send({message: 'El usuario no puede loguearse correctamente'});
						}

					});

				}else{
					res.status(404).send({message: 'El usuario no puede loguearse'});
			}
		}
	});
}
function updateUser(req, res){
	var userId = req.params.id;
	var update = req.body;
	delete update.password;

	if(userId != req.user.sub){
		return res.status(200).sen({message: 'No tienes permiso para actualizar el usuario'});
	}

	User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => {
		if(err){
			res.status(500).send({
				message: 'Error al actualizar el usuario'
			});
		}else{
			if(!userUpdated){
				res.status(404).send({message: 'No se ha podido actualizar el usuario'});
			}else{
				res.status(200).send({user: userUpdated});
			}
		}
	});
}

function uploadImage(req, res){
	var userId = req.params.id;
	var file_name = 'No subido';

	if(req.files){
		var file_path = req.files.image.path;
		var file_split = file_path.split('\\');
		var file_name = file_split[2];

		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
			if(userId != req.user.sub){
				return res.status(200).sen({message: 'No tienes permiso para actualizar el usuario'});
			}

		User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdated) => {
			if(err){
				res.status(500).send({message: 'Error al actualizar el usuario'});
			}else{
				if(!userUpdated){
					res.status(404).send({message: 'No se ha podido actualizar el usuario'});
				}else{
					res.status(200).send({user: userUpdated, image: file_name});
				}
			}
		});

		}else{
			fs.unlink(file_path, (err) => {
				if(err){
					res.status(200).send({message: 'Extension no valida y fichero no borrado'});					
				}else{
					res.status(200).send({message: 'Extension no valida'});
				}
			});
		}
	}else{
		res.status(200).send({message: 'No se ha subido el archivo'});
	}

}

function getImageFile(req, res){
	var imageFile =  req.params.imageFile;
	var path_file = './uploads/users/'+imageFile;

	fs.exists(path_file, function(exists){
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(404).send({message: 'La imagen no existe'});
		}
	});

}

function getKeepers(req, res){
	User.find({role:'ROLE_ADMIN'}).exec((err, users) =>{
		if(err){
			res.status(500).send({message: 'Error en la peticion'});
		}else{
			if(!users){
				res.status(404).send({message: 'No hay cuidadores'});
			}else{
				res.status(200).send({users});
			}
		}
	});
}

module.exports = {
	pruebas,
	saveUser,
	login,
	updateUser,
	uploadImage,
	getImageFile,
	getKeepers
};