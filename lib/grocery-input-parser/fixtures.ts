import { GroceryInputParser } from "./parser";
import { GROCERY_ITEM_KNOWN_UNITS, GROCERY_ITEM_MODIFIERS } from "../constants";

const grocery_list = [
	"2 fpk krossade tomater",
	"4 pkt pasta ekologisk",
	"6 burkar cola ej zero",
	"4 l mjölk",
	"5 pkt chips 2/50 kr",
	"1 rulle toalettpapper",
	"1 dussin ägg färska",
	"1 pkt frukostflingor",
	"1 kg potatis",
	"1 kg äpplen ekologiska",
	"500 g smör",
	"200 g ost",
	"1 pkt yoghurt naturell",
	"500 g ris basmati",
	"250 g havregryn",
	"1 pkt kex saltade",
	"600 g kycklingfilé färsk",
	"300 g köttfärs",
	"200 g bacon",
	"1 fpk frysta grönsaker",
	"1 pkt salladsmix",
	"500 ml olivolja extra virgin",
	"200 g mandlar osaltade",
	"1 limpa fullkornsbröd",
	"1 pkt kaffe malen",
	"1 fpk te grönt",
	"1 flaska apelsinjuice",
	"1 pkt glass vanilj",
	"1 burk jordgubbssylt",
	"1 pkt vetemjöl för bakning",
	"4 libero blöjor",
];

const parser = new GroceryInputParser(
	GROCERY_ITEM_KNOWN_UNITS,
	GROCERY_ITEM_MODIFIERS,
);

for (const line of grocery_list) {
	console.log(line, "=>", parser.parse(line));
}
