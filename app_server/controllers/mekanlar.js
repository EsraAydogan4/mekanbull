const axios = require("axios");// kutuphane tanımladık
var apiSecenekleri = { 
    //sunucu: "http://localhost:3001",
    sunucu: "https://mekanbull.esraaydogan4.repl.co", // bunu ben yapıştırdım
    apiYolu: "/api/mekanlar/"
}
var mesafeyiFormatla = function(mesafe){
    var yeniMesafe, birim;
    if(mesafe>1){
        yeniMesafe = parseFloat(mesafe).toFixed(1);
        birim=" km";
    }else{
        yeniMesafe = parseInt(mesafe*1000,10);// 10, 10 luk düzeyde olduğunu gösteriyor
        birim=" m"
    }
    return yeniMesafe+birim;
}
var express = require('express');
var router = express.Router();

var anaSayfaOlustur = function (res, mekanListesi){// res apiden gelen parametreliri alacak
    var mesaj;
    if(!(mekanListesi instanceof Array)){ // dizi şeklinde olduğunu söyledik
        mesaj = "API HATASI: Bir şeyler ters gitti.";
        mekanListesi = [];
    } else { // else if de olabilir
        if(!mekanListesi.length){// mekan yoksa
            mesaj="Civarda herhangi bir mekan yok!";
        }
    }// render
    res.render("anasayfa",{
        "baslik":"Anasayfa",
        "sayfaBaslik":{
            "siteAd":"Mekanbul",
            "slogan":"Civardaki mekanları keşfet!"
        },
        "mekanlar": mekanListesi,
        "mesaj": mesaj
    });
}
const anaSayfa=function(req, res, next) {
   axios.get(apiSecenekleri.sunucu+apiSecenekleri.apiYolu,{
    params:{
        enlem: req.query.enlem,
        boylam: req.query.boylam
    }
   }).then(function(response){
        var i,mekanlar;// mekanları sırasıyla dolaşacak cevap döndürecek
        mekanlar = response.data;
        for (i=0;i<mekanlar.length;i++){
            mekanlar[i].mesafe = mesafeyiFormatla(mekanlar[i].mesafe);
        }
        anaSayfaOlustur(res,mekanlar);
   }).catch(function(hata){
    anaSayfaOlustur(res, hata);
   });
}
var detaySayfasiOlustur = function(res, mekanDetaylari){
    mekanDetaylari.koordinat = {
        "enlem": mekanDetaylari.koordinat[0],
        "boylam": mekanDetaylari.koordinat[1]
    }
    res.render('mekanbilgisi',
    {
        mekanBaslik: mekanDetaylari.ad,
        mekanDetay: mekanDetaylari
    });
}
var hataGoster = function (res, hata){
    var mesaj;
    if (hata.response.status == 404){
        mesaj = "404, Sayfa Bulunamadı!";
    }else{
        mesaj = hata.response.status+" hatası";
    }
    res.status(hata.response.status);
    res.render('error',{
        "mesaj": mesaj
    });
};
const mekanBilgisi=function(req, res) {
    axios
        .get(apiSecenekleri.sunucu + apiSecenekleri.apiYolu + req.params.mekanid)
        .then( function (response) {// mekan bilgisi başarılı bir şekilde geldi
            req.session.mekanAdi = response.data.ad;
            detaySayfasiOlustur(res, response.data);
        })
        .catch( function (hata) {
            hataGoster (res, hata);
        });
};
const yorumEkle=function(req, res) {
    var mekanAdi = req.session.mekanAdi;
    var mekanid = req.params.mekaid;
    if(!mekanAdi){
        res.redirect("/mekan/"+mekanid); // mekanın olduğu sayfaya yönlendirdik
    } else
    res.render("yorumekle", {"baslik":mekanAdi+" mekanına yorum ekle", title:"Yorum Sayfası" });
}
const yorumumuEkle=function(req, res, next) {
    var gonderilenYorum,mekanid;
    mekanid=req.params.mekanid;
    if(!req.body.adsoyad || !req.body.yorum){
        req.redirect("/mekan/"+mekanid+"/yorum/yeni?hata=evet");
    } else {
        gonderilenYorum = {
            yorumYapan: req.body.adsoyad,
            puan:req.body.puan,
            yorumMetni: req.body.yorum
        }
        axios
        .post(apiSecenekleri.sunucu+apiSecenekleri.apiYolu+mekanid+"/yorumlar",gonderilenYorum)
        .then(function(){
            res.redirect("/mekan/"+mekanid);
        }); //apinin tam yolu
    }
}
module.exports={
    anaSayfa,
    mekanBilgisi,
    yorumEkle,
    yorumumuEkle
}
