import React from 'react';
import GroundNav from '../components/GroundNav';
import PrairieGrass from '../components/PrairieGrass';
import Carousel from '../components/Carousel';
import CloudBand from '../components/CloudBand';
import './Home.css';

const Home = () => {
  return (
    <>
      <CloudBand />
      <Carousel />
      <PrairieGrass />
      <GroundNav />
    </>
  );
};

export default Home;