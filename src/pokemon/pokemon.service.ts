import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  private defaultLimit = this.configServide.get<number>('defaultLimit');

  constructor(

    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configServide: ConfigService,

  ) {}

  async create(createPokemonDto: CreatePokemonDto) {

    createPokemonDto.name = createPokemonDto.name.toLowerCase().trim();

    try {

      const pokemon = await this.pokemonModel.create( createPokemonDto );
      return pokemon;

    } catch (error) {

      this.handleException( error );

    }
  }

  findAll( paginationDto: PaginationDto) {

    const { limit = this.defaultLimit, offset = 0 } = paginationDto;

    return this.pokemonModel.find()
      .limit( limit )
      .skip( offset )
      .sort({
        no: 1
      })
      .select('-__v');
  }

  async findOne(term: string) {

    let pokemon: Pokemon;

    // Find by no
    if ( !isNaN( +term ) ) {
      pokemon = await this.pokemonModel.findOne( { no: term } );
    }

    // Find by MongoID
    if ( !pokemon && isValidObjectId( term ) ) {
      pokemon = await this.pokemonModel.findById( term );
    }

    // Find by name
    if ( !pokemon ) {
      pokemon = await this.pokemonModel.findOne( { name: term.toLowerCase().trim() } );
    }

    if ( !pokemon ) throw new NotFoundException(`Pokemon with id, name or no "${term}" not found`);

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon =  await this.findOne( term );

    if ( updatePokemonDto.name )
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase().trim();

    try {

      await pokemon.updateOne( updatePokemonDto, {new: true} );
      return { ...pokemon.toJSON(), ...updatePokemonDto };

    } catch (error) {

      this.handleException( error );

    }

  }

  async remove(id: string) {

    // const pokemon = await this.findOne( id );

    // await pokemon.deleteOne();

    // const resultado = await this.pokemonModel.findByIdAndDelete( id );

    const { deletedCount } = await this.pokemonModel.deleteOne( { _id: id } );

    if ( deletedCount === 0 ) throw new BadRequestException(`Pokemon with id "${id}" not found`);

    return;
  }

  private handleException( error: any ) {

    if ( error.code === 11000 ) {
      throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify( error.keyValue ) }`);
    }

    throw new InternalServerErrorException("Can't create or update pokemon - Check server logs");

  }
}
