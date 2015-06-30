Toyz for Data Analysis
======================

What is Toyz?
-------------
Toyz was initially created as a way to view and interact with FITS images stored on a remote 
server, as well as perform data reduction needed for my PhD. I couldn't find any easy to use
and well documented astronomy tools for this task so I set out to create my own application.

In a nutshell Toyz is a web application framework designed to meet the needs of "Big Data"
scientists by allowing them to interact with their data via a web browser and run
scripts on a remote server (or perhaps a gpu cluster) that stores their data.
There are a few simple ideas that have been (and will continue to be) essential to the
development of toyz (think of it as a mission statement): 
    1. It should be easy to install with as few dependencies as possible
    2. It should take up a minimal amount of disk space
    3. It should be well documented and easy to user
    4. An undergraduate summer REU student should be able to start analyzing data with
       it on his/her first day!

Documentation
-------------
See the [documentation](http://fred3m.github.io/toyz/) for information on installing and
getting started with Toyz.

Toyz Sceenshots
---------------

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/colormap.png)

Change the color mapping for FITS images


![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/open_file.png)

Open a data file from the server using python, numpy, or pandas (astropy in the future)

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/plots.png)

Interactive plots using Highcharts (custom js plot libraries can also be used)

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/surface_plot.png)

With the [Astro-Toyz](https://github.com/fred3m/astro-toyz) package you can
view surface plots, pixel distribution histograms, and WCS.

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/color_mag.png)

Custom web pages can be written to connect interactive plots to surface plots and
images from different data sources

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/user_settings.png)

User settings in admin console

Acknowledgements
----------------

Toyz has been partially funded by NSF award AST-1313029.