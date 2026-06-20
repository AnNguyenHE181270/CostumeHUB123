## **PROJECT**  **HỆ THỐNG QUẢN LÝ VÀ CHO THUÊ TRANG PHỤC NỮ  MATSL RENTAL SHOP** {#project-hệ-thống-quản-lý-và-cho-thuê-trang-phục-nữ-matsl-rental-shop}

| Mã tài liệu: | BRD\_MATSL\_2026\_V1 |
| :---- | :---- |
| **Phiên bản:** | 1.0 |
| **Ngày lập:** | 01/06/2026 |
| **Tác giả:** | sonht |

**Mục lục**  
 [**HỆ THỐNG QUẢN LÝ VÀ CHO THUÊ TRANG PHỤC NỮ  MATSL RENTAL SHOP	1**](#project-hệ-thống-quản-lý-và-cho-thuê-trang-phục-nữ-matsl-rental-shop)

[**1\. THÔNG TIN CHUNG VÀ MỤC TIÊU DỰ ÁN	1**](#1.-thông-tin-chung-và-mục-tiêu-dự-án)

[1.1. Bối cảnh dự án (Business Context)	1](#1.1.-bối-cảnh-dự-án)

[1.2. Mục tiêu chiến lược (Strategic Objectives)	2](#1.2.-mục-tiêu-chiến-lược)

[1.3. Phạm vi dự án (Project Scope)	2](#1.3.-phạm-vi-dự-án)

[**2\. ĐỐI TƯỢNG SỬ DỤNG HỆ THỐNG (ACTORS & USER ROLES)	2**](#2.-đối-tượng-sử-dụng-hệ-thống)

[**3\. QUY TẮC VÀ LUỒNG NGHIỆP VỤ CỐT LÕI (BUSINESS RULES & WORKFLOWS)	3**](#3.-quy-tắc-và-luồng-nghiệp-vụ-cốt-lõi)

[3.1. Quy tắc ràng buộc Danh mục và Sản phẩm (Category & Costume Constraints)	3](#3.1.-quy-tắc-ràng-buộc-danh-mục-và-sản-phẩm-\(category-&-costume-constraints\))

[3.2. Quy tắc tính Thời gian đệm Giặt ủi (Dry Cleaning Buffer Time)	3](#3.2.-quy-tắc-tính-thời-gian-đệm-giặt-ủi-\(dry-cleaning-buffer-time\))

[3.3. Ma trận chuyển đổi trạng thái Trang phục (Costume Status Matrix)	3](#3.3.-ma-trận-chuyển-đổi-trạng-thái-trang-phục-\(costume-status-matrix\))

[**4\. YÊU CẦU CHỨC NĂNG MỨC CAO (HIGH-LEVEL FUNCTIONAL REQUIREMENTS)	4**](#4.-yêu-cầu-chức-năng-mức-cao)

[4.1. Phân hệ Khách hàng (Front-End Web/App dành cho Nữ)	4](#heading=h.sas72cw9v4w)

[4.2. Phân hệ Vận hành & Cửa hàng (Back-End dành cho Staff & Admin)	4](#4.2.-phân-hệ-vận-hành-&-cửa-hàng-\(back-end-dành-cho-staff-&-admin\))

[**5\. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)	4**](#5.-yêu-cầu-phi-chức-năng)

[5.1. Hiệu năng và Tải hệ thống (Performance & Scalability)	4](#heading=h.z6xvn1ue9dia)

[5.2. Tính bảo mật (Security)	5](#5.2.-tính-bảo-mật-\(security\))

[**6\. GIẢ ĐỊNH VÀ HẠN CHẾ (ASSUMPTIONS & CONSTRAINTS)	5**](#6.-giả-định-và-hạn-chế)

## **1\. THÔNG TIN CHUNG VÀ MỤC TIÊU DỰ ÁN** {#1.-thông-tin-chung-và-mục-tiêu-dự-án}

### **1.1. Bối cảnh dự án** {#1.1.-bối-cảnh-dự-án}

Ngành cho thuê trang phục nữ (đặc biệt là áo dài, váy dạ hội, trang phục concept) đang tăng trưởng mạnh mẽ do nhu cầu chụp ảnh, dự sự kiện và tiệc cưới ngày một tăng cao. Tuy nhiên, các cửa hàng hiện tại chủ yếu quản lý bằng sổ tay hoặc file Excel rời rạc, dẫn đến các rủi ro:

* Khách đặt trùng lịch của cùng một chiếc váy trong cùng một ngày.  
* Không quản lý được thời gian chờ để mang váy đi giặt ủi (Dry Cleaning), dẫn đến giao đồ bẩn hoặc đồ chưa kịp khô cho khách sau.  
* Khó tính toán chính xác số tiền phạt khi khách trả muộn, làm rách, hoặc làm mất phụ kiện kèm theo (mấn, nơ, trâm cài...).

### **1.2. Mục tiêu chiến lược** {#1.2.-mục-tiêu-chiến-lược}

* **Số hóa 100% tài sản:** Quản lý chi tiết từng chiếc váy theo mã SKU độc nhất, đi kèm thuộc tính vật lý (Size, Số đo 3 vòng, Tình trạng hao mòn).  
* **Tự động hóa luồng đặt giữ chỗ (Booking Engine):** Ngăn chặn hoàn toàn tình trạng "Overbooking" (trùng lịch).  
* **Tối ưu hóa quy trình quay vòng sản phẩm:** Thiết lập khoảng thời gian đệm tự động (Buffer time) cho khâu giặt hấp.  
* **Minh bạch tài chính:** Tự động hóa việc tính toán chi phí thuê, tiền đặt cọc (Deposit), và phí phạt phát sinh khi hoàn đồ.

### **1.3. Phạm vi dự án**  {#1.3.-phạm-vi-dự-án}

* **Nằm trong phạm vi:** Xây dựng hệ thống Web/App phục vụ 2 đối tượng cốt lõi: Khách hàng nữ (Tìm kiếm, xem lịch trống, đặt thuê, thanh toán trực tuyến) và Nhân viên cửa hàng/Chủ shop (Duyệt đơn, kiểm trạng, giao/nhận đồ, quản lý kho đồ giặt).  
* **Nằm ngoài phạm vi:** Hệ thống không tự động xử lý giặt đồ vật lý (chỉ quản lý trạng thái trên phần mềm). Không bao gồm tính năng tự thiết kế/may đo trang phục theo yêu cầu.

## **2\. ĐỐI TƯỢNG SỬ DỤNG HỆ THỐNG**  {#2.-đối-tượng-sử-dụng-hệ-thống}

| Tên vai trò (Actor) | Mô tả trách nhiệm | Khả năng tương tác hệ thống |
| :---- | :---- | :---- |
| **Khách thuê (Renter \- Nữ)** | Người dùng cuối có nhu cầu thuê trang phục để đi tiệc, chụp ảnh, sự kiện. | Xem danh mục, kiểm tra lịch trống của sản phẩm theo ngày, đặt đồ, thanh toán tiền thuê \+ cọc, theo dõi đơn hàng, yêu cầu trả đồ. |
| **Nhân viên cửa hàng (Staff)** | Nhân viên trực quầy phụ trách bàn giao đồ, kiểm hàng và tiếp nhận đồ hoàn trả. | Xác nhận trạng thái đơn, thực hiện kiểm tra tình trạng váy khi giao/nhận, nhập mức phạt cấu hao, chuyển đồ sang trạng thái giặt ủi. |
| **Chủ cửa hàng (Admin)** | Người sở hữu shop, quản lý dòng tiền và cấu hình hệ thống. | Quản lý danh mục, thêm mới trang phục, cấu hình biểu phí phạt, thiết lập thời gian giặt hấp (buffer time), xem báo cáo doanh thu và đối soát cổng thanh toán. |

## **3\. QUY TẮC VÀ LUỒNG NGHIỆP VỤ CỐT LÕI**  {#3.-quy-tắc-và-luồng-nghiệp-vụ-cốt-lõi}

### **3.1. Quy tắc ràng buộc Danh mục và Sản phẩm (Category & Costume Constraints)** {#3.1.-quy-tắc-ràng-buộc-danh-mục-và-sản-phẩm-(category-&-costume-constraints)}

* **Ràng buộc Đơn nhất (1-1):** Để tối ưu bộ lọc tìm kiếm và tránh trùng lặp dữ liệu, hệ thống áp dụng mô hình cây danh mục (Parent-Child). Một sản phẩm trang phục (costume) **chỉ được phép liên kết với duy nhất 1 danh mục con cấp thấp nhất (Leaf Category)**.  
* **Thuộc tính bắt buộc đối với thời trang nữ:** Tất cả trang phục khi khởi tạo bắt buộc phải có thông số kỹ thuật bao gồm: Size chữ (S, M, L, XL), Số đo vòng ngực (Bust), Số đo vòng eo (Waist), Màu sắc, Chất liệu, và Danh sách phụ kiện đi kèm bắt buộc (Ví dụ: 1 áo dài \+ 1 quần lụa \+ 1 mấn đội đầu \= 1 SKU).

### **3.2. Quy tắc tính Thời gian đệm Giặt ủi (Dry Cleaning Buffer Time)** {#3.2.-quy-tắc-tính-thời-gian-đệm-giặt-ủi-(dry-cleaning-buffer-time)}

* Ngay khi một đơn hàng chuyển sang trạng thái **Returned (Đã trả đồ)**, hệ thống sẽ tự động khóa lịch của trang phục đó trên lịch hiển thị của khách hàng trong vòng **48 giờ tiếp theo** (Cấu hình linh hoạt bởi Admin) và chuyển trạng thái trang phục thành dry\_cleaning. Khách hàng khác sẽ không thể bấm chọn thuê chiếc váy này trong khung giờ đệm đó.

### **3.3. Ma trận chuyển đổi trạng thái Trang phục (Costume Status Matrix)** {#3.3.-ma-trận-chuyển-đổi-trạng-thái-trang-phục-(costume-status-matrix)}

| Trạng thái ban đầu | Hành động kích hoạt | Trạng thái đích | Logic xử lý của hệ thống |
| :---- | :---- | :---- | :---- |
| **Available** (Sẵn sàng) | Khách đặt lịch \+ Thanh toán cọc thành công | **Rented** (Đang cho thuê) | Khóa lịch của trang phục trong khoảng thời gian khách chọn trên Calendar. |
| **Rented** (Đang cho thuê) | Nhân viên nhận lại đồ tại quầy và xác nhận | **Dry Cleaning** (Đang giặt) | Kích hoạt bộ đếm thời gian đệm (Buffer Time). Khóa lịch 48 tiếng. |
| **Dry Cleaning** (Đang giặt) | Hết thời gian đệm HOẶC Nhân viên bấm "Đã giặt xong" | **Available** (Sẵn sàng) | Mở khóa lịch hiển thị, cho phép khách hàng tiếp theo đặt thuê. |
| **Rented** / **Dry Cleaning** | Phát sinh rách, hỏng, bẩn không thể tẩy rửa | **Damaged** (Đã hỏng) | Rút sản phẩm ra khỏi kho hiển thị trên giao diện người dùng để chuyển đi sửa chữa hoặc thanh lý. |

## 

## **4\. YÊU CẦU CHỨC NĂNG MỨC CAO**  {#4.-yêu-cầu-chức-năng-mức-cao}

## **4.1. Phân hệ Khách hàng (Front-End Web/App dành cho Nữ)**

* **FR-01: Bộ lọc trang phục nâng cao:** Cho phép lọc sản phẩm theo Danh mục đơn, Size (S/M/L), Màu sắc, Khoảng giá và đặc biệt là lọc theo **Ngày cần sử dụng (Check-in/Check-out Date)** để hiển thị những đồ còn trống lịch.  
* **FR-02: Đặt lịch và Giữ đồ (Booking Engine):** Khách hàng chọn ngày nhận đồ và ngày trả đồ. Hệ thống tự động tính tổng tiền thuê dựa trên các block ngày cố định (Gói 1 ngày, Gói 3 ngày, Gói 1 tuần).  
* **FR-03: Thanh toán tích hợp ký quỹ:** Bắt buộc khách hàng phải thanh toán trực tuyến qua cổng (VNPAY/VietQR) bao gồm: Tổng tiền thuê \+ Tiền đặt cọc (Deposit). Hệ thống sẽ giữ khoản tiền cọc này làm tài sản bảo chứng.

### **4.2. Phân hệ Vận hành & Cửa hàng (Back-End dành cho Staff & Admin)** {#4.2.-phân-hệ-vận-hành-&-cửa-hàng-(back-end-dành-cho-staff-&-admin)}

* **FR-04: Tiếp nhận và Kiểm trạng bàn giao (Check-out Audit):** Khi giao đồ cho khách, nhân viên chụp ảnh tình trạng váy thực tế, tick chọn xác nhận đồ nguyên vẹn và xuất biên bản bàn giao điện tử.  
* **FR-05: Tiếp nhận hoàn đồ & Khấu trừ cọc (Check-in Audit):** Khi khách trả váy, nhân viên đối chiếu với danh sách phụ kiện đi kèm và tình trạng hao mòn:  
  * Nếu đồ nguyên vẹn: Hệ thống kích hoạt lệnh hoàn trả 100% tiền đặt cọc về tài khoản khách hàng.  
  * Nếu đồ hỏng/thiếu phụ kiện/trả muộn: Nhân viên nhập số tiền phạt, hệ thống tự động trừ tiền phạt vào tiền cọc, và hoàn trả số tiền còn lại cho khách.  
* **FR-06: Tự động chạy lịch phạt quá hạn (Late Fee Engine):** Hệ thống chạy lệnh ngầm (Cronjob) vào lúc 23:59 mỗi ngày. Nếu đơn hàng chưa chuyển sang trạng thái "Đã trả", hệ thống tự động cộng dồn số tiền bằng công thức: Số ngày muộn $\\times$ lateFeePerDay vào mục chi phí phát sinh của đơn hàng.

## **5\. YÊU CẦU PHI CHỨC NĂNG**  {#5.-yêu-cầu-phi-chức-năng}

## **5.1. Hiệu năng và Tải hệ thống** 

* **NFR-01:** Thời gian phản hồi của bộ lọc tìm kiếm trang phục trống lịch phải nhỏ hơn 1.5 giây khi số lượng bản ghi sản phẩm đạt ngưỡng 50,000 sản phẩm.  
* **NFR-02:** Hệ thống phải đảm bảo tính toàn vẹn dữ liệu (ACID Compliance) tuyệt đối tại bước thanh toán và giữ chỗ, không để xảy ra hiện tượng 2 khách hàng thanh toán trùng 1 sản phẩm tại cùng 1 thời điểm (Race Condition).

### **5.2. Tính bảo mật (Security)** {#5.2.-tính-bảo-mật-(security)}

* **NFR-03:** Toàn bộ thông tin cá nhân của khách hàng (Số điện thoại, Số đo cơ thể) và thông tin tài khoản ngân hàng hoàn cọc phải được mã hóa truyền tải qua giao thức HTTPS.  
* **NFR-04:** Phân quyền kiểm soát truy cập (RBAC) nghiêm ngặt: Nhân viên cửa hàng không có quyền sửa đổi biểu phí thuê hoặc xóa lịch sử đơn hàng, quyền này thuộc về duy nhất tài khoản Admin (Chủ shop).

## **6\. GIẢ ĐỊNH VÀ HẠN CHẾ** {#6.-giả-định-và-hạn-chế}

* ***Giả định:** Khách hàng sở hữu tài khoản ngân hàng hoặc ví điện tử hợp lệ để tiếp nhận dòng tiền hoàn cọc tự động từ cổng thanh toán đối tác của shop.*  
* ***Hạn chế:** Hệ thống chưa hỗ trợ định vị GPS theo thời gian thực để theo dõi vị trí của chiếc váy khi khách hàng mang đi ngoại cảnh, mọi quy trình kiểm soát vị trí đều dựa trên thời hạn cam kết của hợp đồng đặt thuê.*

