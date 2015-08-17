.. _highcharts:

**********
Highcharts
**********
`Highcharts <http://www.highcharts.com/>`_ is an open source javascript library created by
Highsoft that makes it easy to generate a variety of different interactive charts and plots.

.. warning::

    While the software is free for personal and academic use, a reasonably priced license is
    required for corporate use. Please see `http://shop.highsoft.com/highcharts.html`_ for more
    information about Highcharts licensing.

Currently only a small portion of the Highcharts API is accessible through the GUI.

For a video demo of conencting data sources in toyz and creating interactive plots
using Highcharts see

.. raw:: html

    <iframe width="420" height="315" src="https://www.youtube.com/embed/tDBf5AsXDlc" 
    frameborder="0" allowfullscreen></iframe>

Creating a New Chart
====================
To create a new Highchart first add a data source (see :ref:`add_data_source` for more).
Next create a new Highcharts tile (see :ref:`add_tile` for more). Once you have chosen the
**Highcharts** tile type, right-click again on the inside of the tile. Notice that new options
have now been added to the context menu. Choose **Edit Chart** to open a dialog that will allow
you to add plots to the current tile.

You can change the title and subtitle of the plot, whether or not any axes are inverted, whether 
or not to show grid lines for the x and y axes, and if and where a plot legend is displayed.

Adding Series to a Chart
========================
To add a new series click on the ``+`` button under the heading **Series**. You can choose the
plot type (not all Highcharts plot types are currently supported), an optional series name, and 
choose a selection of other available settings from the Highcharts API.

Notice that you data source(es) populate a select box labled **data source**. Changing the data
source also changes the available **x column** and **y column** boxes that allow you to choose 
your axes. You can also specify the markers for which points will be displayed clicking the 
**set marker_div** checkbox. 

You can add additional series by clicking the ``+`` button again, and remove the selected 
series by clicking the ``-`` button.

.. note::

    On the same chart you can have series linked to different data sources

Once you are happy with your setting click the ``Set`` button.

Modifying a Charts Properties
=============================
It's just as easy to modify a chart as it is to create one. Just right-click on the chart tile
and choose **Edit Chart**. This will bring up a dialog with all of the current chart options and
allow you to make any modifications you desire. Click ``cancel`` to cancel your changes or 
``Set`` to save your changes and re-build the chart.

Selecting Points and Zooming in
===============================
By default, clicking on a point will select that point on a chart. If you have multiple charts
open (on multiple tiles) that are connected to the same data source, selecting a point 
(or points) on one chart will select the same point(s) on all of the other charts connected
to the same data source.

The default behavior allows the user to select multiple points. To select multiple points click
and drag over an area on the chart. All points in the highlighted region will be selected.

It may also be desirable to zoom into a region on a plot. In this case open the **Edit Chart**
dialog and change the selection type to ``xy zoom``. Now when you click and drag over a set of 
points, Highcharts will zoom into the selected region.

Removing Points
===============
It can often be useful to remove points from a data set. To do this select a group of points and 
right-click the chart. Click ``remove points`` to remove the points from the data sources, which
removes them from all series connected to the same data source.