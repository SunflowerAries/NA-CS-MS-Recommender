from enum import Enum
import requests, csv, string

# need to set
token = 'eb126ac14322062aa76c5c108efdbd3f2a10dd69'
base_url = 'https://search.prtl.co/2018-07-23/?start='
base_url0 = 'https://reflector.prtl.co/?length=0&include_order=false&token=' + token + '&q=id-'
header = ['name', 'degree', 'duration', 'department', 'city', 'state', 'credit', 'toefl', 'description', 'gpa', 'titles', 'payment_type', 'payment_per_unit', 'total_payment', 'living_costs_min', 'living_costs_max']

def getHtmlText(url):
    try:
        r = requests.get(url)
        return r.json()
    except Exception as e:
        print(e)
        return 'Something Wrong!'

def getContent(url):
    html = getHtmlText(url)
    return html

class PaymentType(Enum):
    PAY_BY_CREDIT = 1
    PAY_BY_YEAR = 2
    PAY_BY_FULL = 3
    PAY_BY_SEMESTER = 4
    PAY_BY_MODULE = 5

class Program:
    def __init__(self, name, degree, tuition_fee, duration, department, position):
        self.name = name
        self.degree = degree
        self.duration = int(duration)
        self.department = department
        self.tuition_fee = int(tuition_fee)
        if len(position) != 1:
            print("{} at {} has more than one campus".format(self.name, self.department))
            self.parse_success = False
        else:
            self.city = position[0]["city"]
            self.state = position[0]["area"]
            self.parse_success = True

    def parse_detailed_content(self, detailed_content):
        try:
            if detailed_content["credits_alternative"] != "":
                self.credit = float(detailed_content["credits_alternative"])
            else:
                self.credit = 0
        except Exception as e:
            print(self.name, self.department, e)
            self.parse_success = False

        try:
            if detailed_content["toefl_internet"] != "":
                self.toefl = int(detailed_content["toefl_internet"])
            else:
                self.toefl = 80
        except Exception as e:
            print(self.name, self.department, e)

        self.description = detailed_content["description"]

        try:
            if detailed_content["min_gpa"] != "":
                if detailed_content["min_gpa"] in string.ascii_letters:
                    if detailed_content["min_gpa"] == 'B' or detailed_content["min_gpa"] == 'b':
                        self.gpa = 3.0
                    else:
                        print(self.name + " min_gpa: " + detailed_content["min_gpa"])
                else:
                    self.gpa = float(detailed_content["min_gpa"])
            else:
                self.gpa = 3.0
        except Exception as e:
            print(self.name, self.department, e)

        self.titles = []
        for discipline in detailed_content["disciplines"].values():
            self.titles.append(discipline["title"])
        self.titles = ','.join(self.titles)

        tuition_fee_types = list(filter(lambda x : x["target"] == "international", detailed_content["tuition_fee_types"]))[0]
        self.payment_per_unit = int(tuition_fee_types["amount"])
        if tuition_fee_types["unit"] == "credit":
            self.payment_type = PaymentType.PAY_BY_CREDIT.value
            self.total_payment = self.credit * self.payment_per_unit
        elif tuition_fee_types["unit"] == "year":
            self.payment_type = PaymentType.PAY_BY_YEAR.value
            self.total_payment = self.duration * self.payment_per_unit / 12
        elif tuition_fee_types["unit"] == "full":
            self.payment_type = PaymentType.PAY_BY_FULL.value
            self.total_payment = self.payment_per_unit
        elif tuition_fee_types["unit"] == "semester":
            self.payment_type = PaymentType.PAY_BY_SEMESTER.value
            self.total_payment = self.duration * self.payment_per_unit * 2 / 12
            if abs(self.total_payment - self.duration * self.tuition_fee / 0.85 / 12) > 100:
                print("Error: {} at {} has more than 2 semesters a year with total fees: {} conflicted with {}".format(self.name, self.department, self.total_payment, self.tuition_fee))
        elif tuition_fee_types["unit"] == "module":
            self.payment_type = PaymentType.PAY_BY_MODULE
            print("Error: {} at {} has other tuition_fee_types: {}".format(self.name, self.department, tuition_fee_types["unit"]))
            self.parse_success = False
        
        venues = detailed_content["venues"]["full"]
        cities = venues[list(venues.keys())[0]]["cities"]
        living = cities[list(cities.keys())[0]]
        try:
            if living["living_costs_max"] != "":
                self.living_costs_max = int(living["living_costs_max"])
                self.living_costs_min = int(living["living_costs_min"])
            else:
                self.living_costs_max = 0
                self.living_costs_min = 0
        except Exception as e:
            print(self.name, self.department, e)

def main(base_url, fout):
    writer = csv.writer(fout)
    writer.writerow(header)

    for x in range(0, 1350, 10):
        print(x)
        url = base_url + str(x) + '&q=ci-82%7Cdg-msc%2Cmeng%7Cde-fulltime%7Cdi-24%7Cdur-%5B360%2C360%5D%2C%5B540%2C540%5D%2C%5B720%2C720%5D%2C%5B721%2C-1%5D%7Cen-4064%7Clv-master%7Cmh-face2face%7Ctc-EUR%7Cuc-133'
        contents = getContent(url)

        for content in contents:
            url0 = base_url0 + str(content["id"]) + '&path=data%2Fstudies%2Fany%2Fdetails%2F'
            # print(content)
            if ("tuition_fee" in content.keys()) != True:
                print(content)
                continue
            program = Program(content["title"], content["degree"], content["tuition_fee"]["value"], content["fulltime_duration"]["value"], content["organisation"], content["venues"])
            if program.parse_success != True:
                continue
            detailed_content = getContent(url0)[str(content["id"])]
            program.parse_detailed_content(detailed_content)
            if program.parse_success != True:
                continue
            writer.writerow([program.name, program.degree, program.duration, program.department, program.city, program.state, program.credit, program.toefl,
             program.description, program.gpa, program.titles, program.payment_type, program.payment_per_unit, program.total_payment,
             program.living_costs_min, program.living_costs_max])

if __name__ == '__main__':
    main(base_url, open('src/data/tuition-fee.csv', 'w', encoding='UTF8'))