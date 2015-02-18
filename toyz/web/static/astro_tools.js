// Utilities useful for astronomy applications
// Copyright 2015 by Fred Moolekamp
// License: LGPLv3

// convert degrees to sexagesimal
Toyz.Astro.deg2sex=function(x){
    var y=Math.abs(x);
    var sign=x?x<0?-1:1:0;
    var sex={
        deg:Math.floor(y)
    };
    sex.min=Math.floor((y-sex.deg)*60);
    sex.sec=(y-sex.deg-sex.min/60)*3600;
    sex.deg=sex.deg*sign;
    return sex;
};
// convert sexagesimal to degrees
Toyz.Astro.sex2deg=function(sex){
    var sign=x?x<0?-1:1:0;
    return sign*(Math.abs(sex.deg)+sex.min/60+sex.sec/3600);
};
// convert sexagesimal to string
Toyz.Astro.sex2string=function(sex,precision){
    var pow10=Math.pow(10,precision);
    var sec=Math.round(sex.sec*pow10)/pow10
    return sex.deg.toString()+"\xB0  "+sex.min.toString()+"'  "+sec.toString()+'"';
};
// Initial a set of wcs RA and DEC
Toyz.Astro.initWCScoords=function(ra,dec){
    if(isNaN(ra) || isNaN(dec)){
        //alert("ra and dec must be in decimal form to initialize");
        return {}
    };
    wcsCoords={
        ra:ra,
        dec:dec,
        raSex:Toyz.Core.deg2sex(ra/15),
        decSex:Toyz.Core.deg2sex(dec),
        getRA:function(precision){
            var ra=wcsCoords.raSex;
            var pow10=Math.pow(10,precision);
            var sec=Math.round(ra.sec*pow10)/pow10;
            return ra.hours.toString()+"h "+ra.min.toString()+'m '+sec.toString()+"s";
        },
        getDEC:function(precision){
            return Toyz.Core.sex2string(wcsCoords.decSex,precision);
        }
    };
    wcsCoords.raSex.hours=wcsCoords.raSex.deg;
    wcsCoords.raSex.deg=wcsCoords.raSex.hours*15;
    return wcsCoords;
};